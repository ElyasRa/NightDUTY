<template>
  <MainLayout>
    <div class="container">
      <div class="header">
        <h1 class="title">📮 Rechnungsversand</h1>
        <p class="subtitle">Rechnungen und Mahnungen per E-Mail versenden</p>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button 
          @click="activeTab = 'invoice'" 
          class="tab"
          :class="{ active: activeTab === 'invoice' }"
        >
          📄 Rechnung versenden
        </button>
        <button 
          @click="activeTab = 'dunning'" 
          class="tab"
          :class="{ active: activeTab === 'dunning' }"
        >
          ⚠️ Mahnung versenden
        </button>
      </div>

      <div v-if="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <!-- Invoice/Dunning Sending Form -->
      <div class="card">
        <!-- Step 1: Company Selection -->
        <div class="step">
          <h3 class="step-title">1️⃣ Firma auswählen</h3>
          <div class="form-group">
            <label>Firma *</label>
            <select v-model="selectedCompanyId" @change="onCompanyChange" class="select">
              <option value="">-- Firma wählen --</option>
              <option v-for="company in companies" :key="company.id" :value="company.id">
                {{ company.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Step 2: Invoice Selection -->
        <div class="step" v-if="selectedCompanyId">
          <h3 class="step-title">2️⃣ Rechnung auswählen</h3>
          <div class="form-group">
            <label>Rechnung *</label>
            <select v-model="selectedInvoiceId" @change="onInvoiceChange" class="select">
              <option value="">-- Rechnung wählen --</option>
              <option v-for="invoice in filteredInvoices" :key="invoice.id" :value="invoice.id">
                {{ invoice.invoice_number }} - {{ formatDate(invoice.invoice_date) }} - {{ formatAmount(invoice.total_amount) }}
              </option>
            </select>
          </div>
        </div>

        <!-- Step 3: Email Editor -->
        <div class="step" v-if="selectedInvoiceId && selectedInvoice">
          <h3 class="step-title">3️⃣ E-Mail bearbeiten</h3>
          
          <div class="info-box">
            <p><strong>Empfänger:</strong> {{ selectedInvoice.company.email || 'Keine E-Mail-Adresse hinterlegt' }}</p>
          </div>

          <div v-if="!selectedInvoice.company.email" class="alert alert-error">
            ⚠️ Diese Firma hat keine E-Mail-Adresse hinterlegt. Bitte fügen Sie eine E-Mail-Adresse in der Firmenverwaltung hinzu.
          </div>

          <div v-if="selectedInvoice.company.email">
            <div class="form-group">
              <label>Betreff *</label>
              <input v-model="emailSubject" type="text" class="input" placeholder="Betreff eingeben" />
            </div>

            <div class="form-group">
              <label>Nachricht *</label>
              <textarea v-model="emailBody" class="textarea" rows="8" placeholder="Nachricht eingeben"></textarea>
            </div>

            <div class="attachments-info">
              <h4>📎 Anhänge</h4>
              <div class="attachment-badges">
                <span class="badge badge-primary">📄 Rechnung.pdf</span>
                <span class="badge badge-primary">📊 Stundenreport.pdf</span>
              </div>
              <p class="help-text">Diese Dateien werden automatisch angehängt.</p>
            </div>

            <div class="actions">
              <button 
                @click="sendEmail" 
                class="btn btn-primary btn-large"
                :disabled="sending || !emailSubject || !emailBody"
              >
                <span v-if="!sending">✉️ E-Mail jetzt senden</span>
                <span v-else>⏳ Sende E-Mail...</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import MainLayout from '../layouts/MainLayout.vue'

const activeTab = ref('invoice')
const companies = ref<any[]>([])
const invoices = ref<any[]>([])
const selectedCompanyId = ref('')
const selectedInvoiceId = ref('')
const emailSubject = ref('')
const emailBody = ref('')
const sending = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const API_URL = 'http://localhost:3000/api'

const selectedInvoice = computed(() => {
  return invoices.value.find(inv => inv.id === parseInt(selectedInvoiceId.value))
})

const filteredInvoices = computed(() => {
  if (!selectedCompanyId.value) return []
  return invoices.value.filter(inv => inv.company_id === parseInt(selectedCompanyId.value))
})

onMounted(async () => {
  await loadCompanies()
  await loadInvoices()
})

async function loadCompanies() {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/companies`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    companies.value = response.data
  } catch (error) {
    console.error('Error loading companies:', error)
  }
}

async function loadInvoices() {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/invoices`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    invoices.value = response.data
  } catch (error) {
    console.error('Error loading invoices:', error)
  }
}

function onCompanyChange() {
  selectedInvoiceId.value = ''
  emailSubject.value = ''
  emailBody.value = ''
}

async function onInvoiceChange() {
  if (!selectedInvoiceId.value) return
  
  // Load template and fill in placeholders
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    const invoice = selectedInvoice.value
    if (!invoice) return
    
    const periodStart = new Date(invoice.period_start)
    const periodEnd = new Date(invoice.period_end)
    const period = `${formatDate(periodStart)} - ${formatDate(periodEnd)}`
    
    let subject = ''
    let body = ''
    
    if (activeTab.value === 'invoice') {
      subject = response.data.email_invoice_subject || 'Rechnung {{invoice_number}} - {{company_name}}'
      body = response.data.email_invoice_body || ''
    } else {
      subject = response.data.email_dunning_subject || 'Mahnung - Rechnung {{invoice_number}}'
      body = response.data.email_dunning_body || ''
    }
    
    // Replace placeholders
    subject = subject
      .replace(/{{invoice_number}}/g, invoice.invoice_number)
      .replace(/{{company_name}}/g, invoice.company.name)
      .replace(/{{period}}/g, period)
    
    body = body
      .replace(/{{invoice_number}}/g, invoice.invoice_number)
      .replace(/{{company_name}}/g, invoice.company.name)
      .replace(/{{period}}/g, period)
    
    emailSubject.value = subject
    emailBody.value = body
  } catch (error) {
    console.error('Error loading template:', error)
  }
}

async function sendEmail() {
  if (!selectedInvoiceId.value || !emailSubject.value || !emailBody.value) {
    errorMessage.value = 'Bitte füllen Sie alle Pflichtfelder aus'
    return
  }
  
  sending.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const token = localStorage.getItem('token')
    const response = await axios.post(
      `${API_URL}/email/send-invoice`,
      {
        invoiceId: selectedInvoiceId.value,
        subject: emailSubject.value,
        body: emailBody.value
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
    
    successMessage.value = '✅ ' + response.data.message
    
    // Reset form after 3 seconds
    setTimeout(() => {
      selectedCompanyId.value = ''
      selectedInvoiceId.value = ''
      emailSubject.value = ''
      emailBody.value = ''
      successMessage.value = ''
    }, 3000)
  } catch (error: any) {
    errorMessage.value = '❌ Fehler beim Senden: ' + (error.response?.data?.error || error.message)
    if (error.response?.data?.details) {
      errorMessage.value += ' - ' + error.response.data.details
    }
  } finally {
    sending.value = false
  }
}

function formatDate(dateStr: string | Date): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
}
</script>

<style scoped>
.container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 2rem;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6b7280;
  font-size: 1rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.tab {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: #6b7280;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -2px;
}

.tab:hover {
  color: #3b82f6;
}

.tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.alert-success {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #10b981;
}

.alert-error {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #ef4444;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.step {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.step:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.step-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.select,
.input,
.textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.select:focus,
.input:focus,
.textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.textarea {
  resize: vertical;
  font-family: inherit;
}

.info-box {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.info-box p {
  margin: 0;
  color: #374151;
  font-size: 0.875rem;
}

.attachments-info {
  background: #eff6ff;
  border: 1px solid #3b82f6;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.attachments-info h4 {
  margin: 0 0 0.75rem 0;
  color: #1e40af;
  font-size: 1rem;
  font-weight: 600;
}

.attachment-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-primary {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #3b82f6;
}

.help-text {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1rem;
}
</style>
