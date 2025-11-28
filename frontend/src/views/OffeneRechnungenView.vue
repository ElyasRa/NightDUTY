<template>
  <MainLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Offene Rechnungen</h1>
          <p>Übersicht aller offenen und teilweise bezahlten Rechnungen</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Lade Rechnungen...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="fetchInvoices" class="btn-primary">Erneut versuchen</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="invoices.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" class="empty-icon">
          <path d="M9 11l3 3L22 4" stroke="currentColor" stroke-width="2"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" stroke-width="2"/>
        </svg>
        <h2>Keine offenen Rechnungen</h2>
        <p>Alle Rechnungen wurden bezahlt!</p>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Rechnungsnummer</th>
              <th>Firma</th>
              <th>Rechnungsdatum</th>
              <th>Fälligkeitsdatum</th>
              <th class="text-right">Gesamtbetrag</th>
              <th class="text-right">Bezahlt</th>
              <th class="text-right">Offener Betrag</th>
              <th>Status</th>
              <th class="text-center">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="invoice in invoices" :key="invoice.id">
              <td class="font-medium">{{ invoice.invoice_number }}</td>
              <td>{{ invoice.company.name }}</td>
              <td>{{ formatDate(invoice.invoice_date) }}</td>
              <td :class="{ 'text-red': isOverdue(invoice.due_date) }">
                {{ formatDate(invoice.due_date) }}
                <span v-if="isOverdue(invoice.due_date)" class="overdue-badge">Überfällig</span>
              </td>
              <td class="text-right">{{ formatCurrency(invoice.total_amount) }}</td>
              <td class="text-right">{{ formatCurrency(getTotalPaid(invoice)) }}</td>
              <td class="text-right font-medium">{{ formatCurrency(getOpenAmount(invoice)) }}</td>
              <td>
                <span class="status-badge" :class="'status-' + invoice.status">
                  {{ getStatusLabel(invoice.status) }}
                </span>
              </td>
              <td class="text-center">
                <div class="action-buttons">
                  <button 
                    @click="redirectToPayment(invoice.id)" 
                    class="btn-action"
                    title="Zahlung buchen"
                  >
                    💳 Zahlung buchen
                  </button>
                  <button 
                    @click="downloadPDF(invoice.id)" 
                    class="btn-action-secondary"
                    title="PDF herunterladen"
                  >
                    📄 PDF
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Total Summary -->
      <div v-if="invoices.length > 0" class="total-summary">
        Offene Posten: {{ formatCurrency(totalOpenAmount) }}
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
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

const router = useRouter()
const invoices = ref<Invoice[]>([])
const loading = ref(true)
const error = ref('')

const API_URL = 'http://188.245.198.220:3000'

const fetchInvoices = async () => {
  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/api/invoices`, {
      params: { status: 'open' },
      headers: { Authorization: `Bearer ${token}` }
    })
    invoices.value = response.data
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Fehler beim Laden der Rechnungen'
    console.error('Error fetching invoices:', err)
  } finally {
    loading.value = false
  }
}

const getTotalPaid = (invoice: Invoice): number => {
  return invoice.payments.reduce((sum, payment) => sum + payment.amount, 0)
}

const getOpenAmount = (invoice: Invoice): number => {
  return invoice.total_amount - getTotalPaid(invoice)
}

const totalOpenAmount = computed((): number => {
  return invoices.value.reduce((sum, invoice) => sum + getOpenAmount(invoice), 0)
})

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

const isOverdue = (dueDate: string): boolean => {
  return new Date(dueDate) < new Date()
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    open: 'Offen',
    partial: 'Teilweise bezahlt',
    paid: 'Bezahlt'
  }
  return labels[status] || status
}

const redirectToPayment = (invoiceId: number) => {
  router.push(`/zahlung-buchen?invoice=${invoiceId}`)
}

const downloadPDF = async (invoiceId: number) => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/api/invoices/${invoiceId}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    })
    
    // Create a blob URL and trigger download
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Rechnung-${invoiceId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err: any) {
    console.error('Error downloading PDF:', err)
    let errorMessage = 'Fehler beim Herunterladen der PDF'
    if (err.response?.status === 404) {
      errorMessage = 'PDF nicht gefunden'
    } else if (err.response?.status === 403 || err.response?.status === 401) {
      errorMessage = 'Keine Berechtigung zum Herunterladen der PDF'
    } else if (err.response?.data) {
      errorMessage = err.response.data.error || errorMessage
    }
    alert(errorMessage)
  }
}

onMounted(() => {
  fetchInvoices()
})
</script>

<style scoped>
.page-container {
  padding: 2rem;
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

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #d946ef;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: rgba(255, 255, 255, 0.3);
  margin: 0 auto 1rem;
}

.empty-state h2 {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: rgba(255, 255, 255, 0.6);
}

.table-container {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: rgba(255, 255, 255, 0.05);
}

.data-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.data-table tbody tr {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  transition: background-color 0.15s;
}

.data-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.05);
}

.data-table td {
  padding: 1rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

.font-medium {
  font-weight: 500;
  color: #ffffff;
}

.text-red {
  color: #ef4444;
}

.overdue-badge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.125rem 0.5rem;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
  border: 1px solid rgba(239, 68, 68, 0.3);
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

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
}

.btn-action {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(217, 70, 239, 0.3);
}

.btn-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(217, 70, 239, 0.4);
}

.btn-action-secondary {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn-action-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  border-color: #d946ef;
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

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(217, 70, 239, 0.4);
}

.error-state p {
  color: #ef4444;
  margin-bottom: 1rem;
}

.loading-state p {
  color: rgba(255, 255, 255, 0.6);
}

.total-summary {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
</style>
