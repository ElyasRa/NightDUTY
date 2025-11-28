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

        <!-- Step 3: Stundenreport Time Range -->
        <div class="step" v-if="selectedInvoiceId && selectedInvoice && attachHoursReport">
          <h3 class="step-title">3️⃣ Stundenreport Zeitraum</h3>
          <p class="help-text" style="margin-bottom: 1rem;">Der Zeitraum für den Stundenreport wird automatisch aus der Rechnung übernommen. Sie können ihn hier anpassen.</p>
          <div class="date-range-row">
            <div class="form-group">
              <label>Zeitraum Von *</label>
              <input v-model="reportStartDate" type="date" class="input" />
            </div>
            <div class="form-group">
              <label>Zeitraum Bis *</label>
              <input v-model="reportEndDate" type="date" class="input" />
            </div>
          </div>
        </div>

        <!-- Step 4: Email Editor -->
        <div class="step" v-if="selectedInvoiceId && selectedInvoice">
          <h3 class="step-title">{{ attachHoursReport ? '4️⃣' : '3️⃣' }} E-Mail bearbeiten</h3>
          
          <div class="form-group">
            <label>Empfänger E-Mail *</label>
            <input v-model="recipientEmail" type="email" class="input" placeholder="E-Mail-Adresse eingeben" />
          </div>

          <div v-if="!recipientEmail" class="alert alert-error">
            ⚠️ Bitte geben Sie eine E-Mail-Adresse ein.
          </div>

          <div v-if="recipientEmail">
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
                <span v-if="attachHoursReport" class="badge badge-primary">📊 Stundenreport.pdf</span>
              </div>
              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="attachHoursReport" class="checkbox" />
                  <span>Stundenreport anhängen</span>
                </label>
              </div>
              <p class="help-text">Die Rechnung wird immer angehängt.</p>
            </div>

            <div class="actions">
              <button 
                @click="sendEmail" 
                class="btn btn-primary btn-large"
                :disabled="sending || !emailSubject || !emailBody || !recipientEmail"
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
import { API_BASE_URL } from '../config'

const activeTab = ref('invoice')
const companies = ref<any[]>([])
const invoices = ref<any[]>([])
const selectedCompanyId = ref('')
const selectedInvoiceId = ref('')
const emailSubject = ref('')
const emailBody = ref('')
const recipientEmail = ref('')
const attachHoursReport = ref(true)
const reportStartDate = ref('')
const reportEndDate = ref('')
const sending = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

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
    const response = await axios.get(`${API_BASE_URL}/companies`, {
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
    const response = await axios.get(`${API_BASE_URL}/invoices`, {
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
  recipientEmail.value = ''
  attachHoursReport.value = true
  reportStartDate.value = ''
  reportEndDate.value = ''
}

async function onInvoiceChange() {
  if (!selectedInvoiceId.value) return
  
  // Load template and fill in placeholders
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE_URL}/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    const invoice = selectedInvoice.value
    if (!invoice) return
    
    // Pre-fill recipient email with company's stored email
    recipientEmail.value = invoice.company.email || ''
    
    // Pre-fill report date range with invoice period
    const periodStart = new Date(invoice.period_start)
    const periodEnd = new Date(invoice.period_end)
    reportStartDate.value = periodStart.toISOString().split('T')[0] ?? ''
    reportEndDate.value = periodEnd.toISOString().split('T')[0] ?? ''
    
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
  if (!selectedInvoiceId.value || !emailSubject.value || !emailBody.value || !recipientEmail.value) {
    errorMessage.value = 'Bitte füllen Sie alle Pflichtfelder aus'
    return
  }
  
  sending.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const token = localStorage.getItem('token')
    const response = await axios.post(
      `${API_BASE_URL}/email/send-invoice`,
      {
        invoiceId: selectedInvoiceId.value,
        subject: emailSubject.value,
        body: emailBody.value,
        recipientEmail: recipientEmail.value,
        attachHoursReport: attachHoursReport.value,
        reportStartDate: attachHoursReport.value ? reportStartDate.value : undefined,
        reportEndDate: attachHoursReport.value ? reportEndDate.value : undefined
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
      recipientEmail.value = ''
      attachHoursReport.value = true
      reportStartDate.value = ''
      reportEndDate.value = ''
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
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #0a0a0a 100%);
}

.header {
  margin-bottom: 2rem;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: #ff006e;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.tab {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -2px;
}

.tab:hover {
  color: #d946ef;
}

.tab.active {
  color: #d946ef;
  border-bottom-color: #d946ef;
}

.alert {
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.alert-success {
  background-color: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.alert-error {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.step {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.step:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.step-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #ff006e;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
}

.date-range-row {
  display: flex;
  gap: 1rem;
}

.date-range-row .form-group {
  flex: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.form-group label {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.select,
.input,
.textarea {
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.select:focus,
.input:focus,
.textarea:focus {
  outline: none;
  border-color: #ff006e;
  box-shadow: 0 0 0 3px rgba(255, 0, 110, 0.15);
  background: rgba(255, 255, 255, 0.08);
}

.select option {
  background: #1e293b;
  color: #ffffff;
}

.textarea {
  resize: vertical;
  font-family: inherit;
}

.info-box {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.info-box p {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
}

.attachments-info {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.attachments-info h4 {
  margin: 0 0 0.75rem 0;
  color: #d946ef;
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
  background: rgba(217, 70, 239, 0.2);
  color: #d946ef;
  border: 1px solid rgba(217, 70, 239, 0.4);
}

.help-text {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.checkbox-group {
  margin-top: 0.75rem;
  margin-bottom: 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: #d946ef;
  cursor: pointer;
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
  background: linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 8px 24px rgba(217, 70, 239, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(217, 70, 239, 0.4);
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1rem;
}
</style>
