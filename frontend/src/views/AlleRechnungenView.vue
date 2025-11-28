<template>
  <MainLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Alle Rechnungen</h1>
          <p>Vollständige Übersicht aller Rechnungen</p>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="filter-group">
          <label>Suche:</label>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Rechnungsnummer, Firma..."
            class="search-input"
          />
        </div>
        <div class="filter-group">
          <label>Status:</label>
          <select v-model="statusFilter" class="filter-select">
            <option value="all">Alle</option>
            <option value="open">Offen</option>
            <option value="partial">Teilweise bezahlt</option>
            <option value="paid">Bezahlt</option>
          </select>
        </div>
        <button @click="fetchInvoices" class="btn-refresh">
          🔄 Aktualisieren
        </button>
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
      <div v-else-if="filteredInvoices.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" class="empty-icon">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/>
          <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
        </svg>
        <h2>Keine Rechnungen gefunden</h2>
        <p v-if="searchQuery">Versuchen Sie eine andere Suche</p>
        <p v-else>Es wurden noch keine Rechnungen erstellt</p>
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
              <th class="text-right">Betrag</th>
              <th class="text-right">Bezahlt</th>
              <th>Status</th>
              <th class="text-center">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="invoice in filteredInvoices" :key="invoice.id">
              <td class="font-medium">{{ invoice.invoice_number }}</td>
              <td>{{ invoice.company.name }}</td>
              <td>{{ formatDate(invoice.invoice_date) }}</td>
              <td>{{ formatDate(invoice.due_date) }}</td>
              <td class="text-right">{{ formatCurrency(invoice.total_amount) }}</td>
              <td class="text-right">{{ formatCurrency(getTotalPaid(invoice)) }}</td>
              <td>
                <span class="status-badge" :class="'status-' + invoice.status">
                  {{ getStatusLabel(invoice.status) }}
                </span>
              </td>
              <td class="text-center">
                <div class="action-buttons">
                  <button 
                    @click="downloadPDF(invoice.id)" 
                    class="btn-icon"
                    title="PDF herunterladen"
                  >
                    📄
                  </button>
                  <button 
                    @click="viewDetails(invoice)" 
                    class="btn-icon"
                    title="Details anzeigen"
                  >
                    👁️
                  </button>
                  <button 
                    @click="confirmDelete(invoice)" 
                    class="btn-icon btn-icon-danger"
                    title="Rechnung löschen"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Details Modal -->
      <div v-if="selectedInvoice" class="modal-overlay" @click="closeDetails">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>Rechnungsdetails</h2>
            <button @click="closeDetails" class="btn-close">✕</button>
          </div>
          <div class="modal-body">
            <div class="detail-section">
              <h3>Allgemeine Informationen</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Rechnungsnummer:</span>
                  <span class="detail-value">{{ selectedInvoice.invoice_number }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Firma:</span>
                  <span class="detail-value">{{ selectedInvoice.company.name }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Rechnungsdatum:</span>
                  <span class="detail-value">{{ formatDate(selectedInvoice.invoice_date) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Fälligkeitsdatum:</span>
                  <span class="detail-value">{{ formatDate(selectedInvoice.due_date) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Leistungszeitraum:</span>
                  <span class="detail-value">
                    {{ formatDate(selectedInvoice.period_start) }} - {{ formatDate(selectedInvoice.period_end) }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Status:</span>
                  <span class="status-badge" :class="'status-' + selectedInvoice.status">
                    {{ getStatusLabel(selectedInvoice.status) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Beträge</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Zwischensumme:</span>
                  <span class="detail-value">{{ formatCurrency(selectedInvoice.subtotal) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">MwSt ({{ selectedInvoice.tax_rate }}%):</span>
                  <span class="detail-value">{{ formatCurrency(selectedInvoice.tax_amount) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Gesamtbetrag:</span>
                  <span class="detail-value font-bold">{{ formatCurrency(selectedInvoice.total_amount) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Bezahlt:</span>
                  <span class="detail-value">{{ formatCurrency(getTotalPaid(selectedInvoice)) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Offen:</span>
                  <span class="detail-value font-bold">{{ formatCurrency(getOpenAmount(selectedInvoice)) }}</span>
                </div>
              </div>
            </div>

            <div v-if="selectedInvoice.payments && selectedInvoice.payments.length > 0" class="detail-section">
              <h3>Zahlungen</h3>
              <table class="payments-table">
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th class="text-right">Betrag</th>
                    <th>Notizen</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="payment in selectedInvoice.payments" :key="payment.id">
                    <td>{{ formatDate(payment.payment_date) }}</td>
                    <td class="text-right">{{ formatCurrency(payment.amount) }}</td>
                    <td>{{ payment.notes || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="downloadPDF(selectedInvoice.id)" class="btn-primary">
              📄 PDF herunterladen
            </button>
            <button @click="closeDetails" class="btn-secondary">Schließen</button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div v-if="deleteConfirmInvoice" class="modal-overlay" @click="cancelDelete">
        <div class="modal-content modal-delete-confirm" @click.stop>
          <div class="modal-header">
            <h2>Rechnung löschen</h2>
            <button @click="cancelDelete" class="btn-close">✕</button>
          </div>
          <div class="modal-body">
            <p class="delete-warning">
              Möchten Sie die Rechnung <strong>{{ deleteConfirmInvoice.invoice_number }}</strong> wirklich löschen? Dies kann nicht rückgängig gemacht werden.
            </p>
          </div>
          <div class="modal-footer">
            <button @click="deleteInvoice" class="btn-danger" :disabled="deleteLoading">
              {{ deleteLoading ? 'Löschen...' : '🗑️ Löschen' }}
            </button>
            <button @click="cancelDelete" class="btn-secondary" :disabled="deleteLoading">Abbrechen</button>
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
  notes?: string
}

interface Invoice {
  id: number
  invoice_number: string
  company: Company
  invoice_date: string
  due_date: string
  period_start: string
  period_end: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  status: string
  payments: Payment[]
}

const invoices = ref<Invoice[]>([])
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const statusFilter = ref('all')
const selectedInvoice = ref<Invoice | null>(null)
const deleteConfirmInvoice = ref<Invoice | null>(null)
const deleteLoading = ref(false)

const API_URL = 'http://188.245.198.220:3000'

const filteredInvoices = computed(() => {
  let result = invoices.value

  // Filter by status
  if (statusFilter.value !== 'all') {
    result = result.filter(inv => inv.status === statusFilter.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(inv => 
      inv.invoice_number.toLowerCase().includes(query) ||
      inv.company.name.toLowerCase().includes(query)
    )
  }

  return result
})

const fetchInvoices = async () => {
  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/api/invoices`, {
      params: { status: 'all' },
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

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    open: 'Offen',
    partial: 'Teilweise bezahlt',
    paid: 'Bezahlt'
  }
  return labels[status] || status
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
    link.download = `Rechnung_${invoiceId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err: any) {
    console.error('Error downloading PDF:', err)
    error.value = 'Fehler beim Herunterladen des PDFs'
  }
}

const viewDetails = (invoice: Invoice) => {
  selectedInvoice.value = invoice
}

const closeDetails = () => {
  selectedInvoice.value = null
}

const confirmDelete = (invoice: Invoice) => {
  deleteConfirmInvoice.value = invoice
}

const cancelDelete = () => {
  deleteConfirmInvoice.value = null
}

const deleteInvoice = async () => {
  if (!deleteConfirmInvoice.value) return
  
  deleteLoading.value = true
  try {
    const token = localStorage.getItem('token')
    await axios.delete(`${API_URL}/api/invoices/${deleteConfirmInvoice.value.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    // Remove the invoice from the local list
    invoices.value = invoices.value.filter(inv => inv.id !== deleteConfirmInvoice.value?.id)
    deleteConfirmInvoice.value = null
  } catch (err: any) {
    console.error('Error deleting invoice:', err)
    error.value = err.response?.data?.error || 'Fehler beim Löschen der Rechnung'
  } finally {
    deleteLoading.value = false
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

.filter-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.search-input, .filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.search-input:focus, .filter-select:focus {
  outline: none;
  border-color: #ff006e;
  box-shadow: 0 0 0 3px rgba(255, 0, 110, 0.15);
  background: rgba(255, 255, 255, 0.08);
}

.filter-select option {
  background: #1e293b;
  color: #ffffff;
}

.btn-refresh {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  align-self: flex-end;
  transition: all 0.15s;
  color: rgba(255, 255, 255, 0.8);
}

.btn-refresh:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  border-color: #d946ef;
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

.font-bold {
  font-weight: 700;
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
}

.btn-icon {
  padding: 0.5rem;
  background: transparent;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  transition: transform 0.15s;
}

.btn-icon:hover {
  transform: scale(1.2);
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

.error-state p {
  color: #ef4444;
  margin-bottom: 1rem;
}

.loading-state p {
  color: rgba(255, 255, 255, 0.6);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 0, 110, 0.2);
  border-radius: 16px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ff006e;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.btn-close {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  transition: all 0.15s;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.modal-body {
  padding: 1.5rem;
}

.detail-section {
  margin-bottom: 2rem;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 1rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
}

.detail-value {
  font-size: 0.875rem;
  color: #ffffff;
}

.payments-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
}

.payments-table thead {
  background: rgba(255, 255, 255, 0.05);
}

.payments-table th {
  padding: 0.75rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
}

.payments-table td {
  padding: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-icon-danger {
  color: #ef4444;
}

.btn-icon-danger:hover {
  color: #f87171;
  filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.5));
}

.modal-delete-confirm {
  max-width: 500px;
}

.delete-warning {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  line-height: 1.6;
}

.delete-warning strong {
  color: #ffffff;
}

.btn-danger {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
}

.btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(239, 68, 68, 0.4);
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>
