<template>
  <MainLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Zahlung buchen</h1>
          <p>Erfassen Sie eine Zahlung für eine offene Rechnung</p>
        </div>
      </div>

      <!-- Success Message -->
      <div v-if="success" class="success-container">
        <div class="success-box">
          <div class="success-icon">✅</div>
          <h2>Zahlung erfolgreich gebucht!</h2>
          <div class="success-details">
            <div class="detail-item">
              <span class="detail-label">Rechnung:</span>
              <span class="detail-value">{{ success.invoice_number }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Betrag:</span>
              <span class="detail-value">{{ formatCurrency(success.amount) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Neuer Status:</span>
              <span class="status-badge" :class="'status-' + success.status">
                {{ getStatusLabel(success.status) }}
              </span>
            </div>
          </div>
          <div class="success-actions">
            <button @click="bookAnother" class="btn-primary">Weitere Zahlung buchen</button>
            <button @click="goToOpenInvoices" class="btn-secondary">Zu offenen Rechnungen</button>
          </div>
        </div>
      </div>

      <!-- Payment Form -->
      <div v-else class="form-container">
        <form @submit.prevent="submitPayment" class="payment-form">
          <div class="form-section">
            <h2>Rechnungsauswahl</h2>
            
            <div class="form-group">
              <label>Rechnung *</label>
              <select 
                v-model="formData.invoice_id" 
                @change="onInvoiceChange"
                required
                :disabled="loading"
              >
                <option :value="null">Bitte wählen...</option>
                <option 
                  v-for="invoice in openInvoices" 
                  :key="invoice.id" 
                  :value="invoice.id"
                >
                  {{ invoice.invoice_number }} - {{ invoice.company.name }} (Offen: {{ formatCurrency(getOpenAmount(invoice)) }})
                </option>
              </select>
            </div>

            <div v-if="selectedInvoice" class="invoice-summary">
              <h3>Rechnungsinformationen</h3>
              <div class="summary-grid">
                <div class="summary-item">
                  <span class="summary-label">Firma:</span>
                  <span class="summary-value">{{ selectedInvoice.company.name }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Rechnungsdatum:</span>
                  <span class="summary-value">{{ formatDate(selectedInvoice.invoice_date) }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Fälligkeitsdatum:</span>
                  <span class="summary-value">{{ formatDate(selectedInvoice.due_date) }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Gesamtbetrag:</span>
                  <span class="summary-value">{{ formatCurrency(selectedInvoice.total_amount) }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Bereits bezahlt:</span>
                  <span class="summary-value">{{ formatCurrency(getTotalPaid(selectedInvoice)) }}</span>
                </div>
                <div class="summary-item highlight">
                  <span class="summary-label">Offener Betrag:</span>
                  <span class="summary-value">{{ formatCurrency(getOpenAmount(selectedInvoice)) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedInvoice" class="form-section">
            <h2>Zahlungsdetails</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label>Betrag (€) *</label>
                <input 
                  v-model.number="formData.amount" 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  :max="getOpenAmount(selectedInvoice)"
                  required 
                  placeholder="0.00"
                />
                <button 
                  type="button"
                  @click="setFullAmount"
                  class="btn-fill"
                >
                  Vollen Betrag übernehmen
                </button>
              </div>
              
              <div class="form-group">
                <label>Zahlungsdatum *</label>
                <input 
                  v-model="formData.payment_date" 
                  type="date" 
                  required 
                />
              </div>
            </div>

            <div class="form-group">
              <label>Zahlungsmethode</label>
              <select v-model="formData.payment_method">
                <option value="">Bitte wählen...</option>
                <option value="bank_transfer">Banküberweisung</option>
                <option value="cash">Barzahlung</option>
                <option value="card">Kartenzahlung</option>
                <option value="other">Sonstige</option>
              </select>
            </div>

            <div class="form-group">
              <label>Notizen</label>
              <textarea 
                v-model="formData.notes" 
                rows="3"
                placeholder="Optional: Zusätzliche Informationen zur Zahlung..."
              ></textarea>
            </div>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <div class="form-actions">
            <button 
              type="submit" 
              class="btn-primary"
              :disabled="submitting || !formData.invoice_id"
            >
              {{ submitting ? 'Wird gebucht...' : 'Zahlung buchen' }}
            </button>
            <button 
              type="button" 
              @click="$router.push('/offene-rechnungen')" 
              class="btn-secondary"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import MainLayout from '../layouts/MainLayout.vue'

interface Company {
  id: number
  name: string
  city: string
  customer_number: string
}

interface Payment {
  id: number
  amount: number
  payment_date: string
}

interface Invoice {
  id: number
  invoice_number: string
  company: Company
  invoice_date: string
  due_date: string
  total_amount: number
  status: string
  payments: Payment[]
}

interface SuccessData {
  invoice_number: string
  amount: number
  status: string
}

const router = useRouter()
const route = useRoute()

const openInvoices = ref<Invoice[]>([])
const selectedInvoice = ref<Invoice | null>(null)
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const success = ref<SuccessData | null>(null)

const formData = ref({
  invoice_id: null as number | null,
  amount: 0,
  payment_date: new Date().toISOString().split('T')[0],
  payment_method: '',
  notes: ''
})

const API_URL = 'http://188.245.198.220:3000'

const fetchOpenInvoices = async () => {
  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/api/invoices`, {
      params: { status: 'open' },
      headers: { Authorization: `Bearer ${token}` }
    })
    openInvoices.value = response.data

    // Pre-select invoice from query parameter
    const invoiceIdParam = route.query.invoice
    if (invoiceIdParam) {
      const invoiceId = parseInt(invoiceIdParam as string)
      if (!isNaN(invoiceId)) {
        formData.value.invoice_id = invoiceId
        onInvoiceChange()
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Fehler beim Laden der Rechnungen'
    console.error('Error fetching invoices:', err)
  } finally {
    loading.value = false
  }
}

const onInvoiceChange = () => {
  selectedInvoice.value = openInvoices.value.find(
    inv => inv.id === formData.value.invoice_id
  ) || null
  
  if (selectedInvoice.value) {
    // Set default amount to open amount
    formData.value.amount = getOpenAmount(selectedInvoice.value)
  }
}

const getTotalPaid = (invoice: Invoice): number => {
  return invoice.payments.reduce((sum, payment) => sum + payment.amount, 0)
}

const getOpenAmount = (invoice: Invoice): number => {
  return invoice.total_amount - getTotalPaid(invoice)
}

const setFullAmount = () => {
  if (selectedInvoice.value) {
    formData.value.amount = getOpenAmount(selectedInvoice.value)
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const formatCurrency = (amount: number): string => {
  return amount.toFixed(2) + ' €'
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    open: 'Offen',
    partial: 'Teilweise bezahlt',
    paid: 'Bezahlt'
  }
  return labels[status] || status
}

const submitPayment = async () => {
  if (!formData.value.invoice_id) {
    error.value = 'Bitte wählen Sie eine Rechnung aus'
    return
  }

  if (formData.value.amount <= 0) {
    error.value = 'Betrag muss größer als 0 sein'
    return
  }

  if (selectedInvoice.value && formData.value.amount > getOpenAmount(selectedInvoice.value)) {
    error.value = 'Betrag überschreitet den offenen Rechnungsbetrag'
    return
  }

  submitting.value = true
  error.value = ''

  try {
    const token = localStorage.getItem('token')
    const response = await axios.post(
      `${API_URL}/api/invoices/${formData.value.invoice_id}/payments`,
      {
        amount: formData.value.amount,
        payment_date: formData.value.payment_date,
        payment_method: formData.value.payment_method || null,
        notes: formData.value.notes || null
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    // Show success message
    success.value = {
      invoice_number: response.data.invoice.invoice_number,
      amount: formData.value.amount,
      status: response.data.invoice.status
    }

    console.log('✅ Payment recorded successfully')
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Fehler beim Buchen der Zahlung'
    console.error('Error submitting payment:', err)
  } finally {
    submitting.value = false
  }
}

const bookAnother = () => {
  success.value = null
  selectedInvoice.value = null
  formData.value = {
    invoice_id: null,
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    notes: ''
  }
  fetchOpenInvoices()
}

const goToOpenInvoices = () => {
  router.push('/offene-rechnungen')
}

onMounted(() => {
  fetchOpenInvoices()
})
</script>

<style scoped>
.page-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #0a0a0a 100%);
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  color: #ff006e;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
}

.success-container {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.success-box {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 3rem;
  text-align: center;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.success-box h2 {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 2rem;
}

.success-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  text-align: left;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
}

.detail-label {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}

.detail-value {
  font-weight: 600;
  color: #ffffff;
}

.success-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.form-container {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.payment-form {
  max-width: 800px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h2 {
  color: #ff006e;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: all 0.15s;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #ff006e;
  box-shadow: 0 0 0 3px rgba(255, 0, 110, 0.15);
  background: rgba(255, 255, 255, 0.08);
}

.form-group select option {
  background: #1e293b;
  color: #ffffff;
}

.form-group textarea {
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.btn-fill {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
  color: rgba(255, 255, 255, 0.8);
}

.btn-fill:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  border-color: #d946ef;
}

.invoice-summary {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.invoice-summary h3 {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-item.highlight {
  grid-column: span 2;
  padding: 1rem;
  background: rgba(217, 70, 239, 0.1);
  border-radius: 0.375rem;
  border: 1px solid rgba(217, 70, 239, 0.3);
}

.summary-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
}

.summary-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
}

.summary-item.highlight .summary-value {
  font-size: 1.25rem;
  color: #d946ef;
}

.error-message {
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.375rem;
  color: #ef4444;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 8px 24px rgba(217, 70, 239, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(217, 70, 239, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
}

.status-open {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.status-partial {
  background: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.status-paid {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
</style>
