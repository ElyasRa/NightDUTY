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
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

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
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  color: #111827;
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #6b7280;
  font-size: 1rem;
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
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
  color: #d1d5db;
  margin: 0 auto 1rem;
}

.empty-state h2 {
  color: #111827;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #6b7280;
}

.table-container {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: #f9fafb;
}

.data-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table tbody tr {
  border-top: 1px solid #e5e7eb;
  transition: background-color 0.15s;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.data-table td {
  padding: 1rem;
  color: #374151;
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
}

.text-red {
  color: #ef4444;
}

.overdue-badge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.125rem 0.5rem;
  background: #fee2e2;
  color: #dc2626;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
}

.status-open {
  background: #fef3c7;
  color: #92400e;
}

.status-partial {
  background: #dbeafe;
  color: #1e40af;
}

.status-paid {
  background: #d1fae5;
  color: #065f46;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
}

.btn-action {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s;
  white-space: nowrap;
}

.btn-action:hover {
  background: #2563eb;
}

.btn-action-secondary {
  padding: 0.5rem 1rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s;
  white-space: nowrap;
}

.btn-action-secondary:hover {
  background: #4b5563;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s;
}

.btn-primary:hover {
  background: #2563eb;
}

.error-state p {
  color: #ef4444;
  margin-bottom: 1rem;
}
</style>
