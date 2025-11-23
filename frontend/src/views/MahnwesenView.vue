<template>
  <MainLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Mahnwesen</h1>
          <p>Überfällige Rechnungen verwalten und Mahnungen erstellen</p>
        </div>
      </div>

      <!-- Statistik -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon warning">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2"/>
              <path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Überfällige Rechnungen</div>
            <div class="stat-value">{{ overdueInvoices.length }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon error">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Mahnstufe 1</div>
            <div class="stat-value">{{ countByLevel(1) }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon error">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Mahnstufe 2</div>
            <div class="stat-value">{{ countByLevel(2) }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon critical">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Mahnstufe 3</div>
            <div class="stat-value">{{ countByLevel(3) }}</div>
          </div>
        </div>
      </div>

      <!-- Überfällige Rechnungen -->
      <div class="invoices-section">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          Lade überfällige Rechnungen...
        </div>
        <div v-else-if="overdueInvoices.length === 0" class="empty">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M9 11l3 3L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" stroke-width="2"/>
          </svg>
          <p>Keine überfälligen Rechnungen vorhanden</p>
        </div>
        <div v-else class="invoices-table">
          <table>
            <thead>
              <tr>
                <th>Rechnungsnr.</th>
                <th>Firma</th>
                <th>Rechnungsdatum</th>
                <th>Fälligkeitsdatum</th>
                <th>Tage überfällig</th>
                <th>Betrag</th>
                <th>Mahnstufe</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="invoice in overdueInvoices" :key="invoice.id" :class="getDunningClass(invoice.dunning_level)">
                <td><strong>{{ invoice.invoice_number }}</strong></td>
                <td>{{ invoice.company.name }}</td>
                <td>{{ formatDate(invoice.invoice_date) }}</td>
                <td>{{ formatDate(invoice.due_date) }}</td>
                <td>
                  <span class="days-overdue">{{ getDaysOverdue(invoice.due_date) }} Tage</span>
                </td>
                <td><strong>{{ invoice.total_amount.toFixed(2) }} €</strong></td>
                <td>
                  <span class="dunning-badge" :class="'level-' + invoice.dunning_level">
                    {{ invoice.dunning_level === 0 ? 'Keine' : 'Stufe ' + invoice.dunning_level }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button 
                      v-if="invoice.dunning_level < 3"
                      @click="openDunningModal(invoice)" 
                      class="btn-dunning"
                      :title="'Mahnung Stufe ' + (invoice.dunning_level + 1) + ' erstellen'"
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2"/>
                      </svg>
                      Mahnung {{ invoice.dunning_level + 1 }}
                    </button>
                    <span v-else class="max-level">Max. Stufe erreicht</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mahnungs-Modal -->
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>Mahnung erstellen</h2>
            <button @click="closeModal" class="close-btn">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          
          <div v-if="selectedInvoice" class="modal-body">
            <div class="invoice-info">
              <div class="info-row">
                <span class="label">Rechnung:</span>
                <span class="value">{{ selectedInvoice.invoice_number }}</span>
              </div>
              <div class="info-row">
                <span class="label">Firma:</span>
                <span class="value">{{ selectedInvoice.company.name }}</span>
              </div>
              <div class="info-row">
                <span class="label">Betrag:</span>
                <span class="value">{{ selectedInvoice.total_amount.toFixed(2) }} €</span>
              </div>
              <div class="info-row">
                <span class="label">Aktuelle Stufe:</span>
                <span class="value">{{ selectedInvoice.dunning_level === 0 ? 'Keine' : 'Stufe ' + selectedInvoice.dunning_level }}</span>
              </div>
            </div>

            <form @submit.prevent="createDunning" class="dunning-form">
              <div class="form-group">
                <label>Mahnstufe *</label>
                <select v-model.number="dunningForm.dunning_level" required>
                  <option :value="selectedInvoice.dunning_level + 1">Stufe {{ selectedInvoice.dunning_level + 1 }}</option>
                </select>
              </div>

              <div class="form-group">
                <label>Neue Frist *</label>
                <input v-model="dunningForm.new_due_date" type="date" required />
                <small>Setzen Sie eine neue Zahlungsfrist</small>
              </div>

              <div class="form-group">
                <label>Mahngebühr (€) *</label>
                <input v-model.number="dunningForm.fee_amount" type="number" step="0.01" min="0" required />
                <small>Empfohlene Gebühren: Stufe 1: 5€, Stufe 2: 10€, Stufe 3: 15€</small>
              </div>

              <div class="modal-actions">
                <button type="button" @click="closeModal" class="btn-cancel">Abbrechen</button>
                <button type="submit" class="btn-submit" :disabled="submitting">
                  {{ submitting ? 'Erstelle...' : 'Mahnung erstellen' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Erfolgs-Toast -->
      <div v-if="showSuccessToast" class="toast success">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M9 11l3 3L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" stroke-width="2"/>
        </svg>
        Mahnung erfolgreich erstellt!
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import MainLayout from '@/layouts/MainLayout.vue'

interface Company {
  id: number
  name: string
  customer_number?: string
  email?: string
  phone?: string
}

interface Dunning {
  id: number
  dunning_level: number
  dunning_date: string
  new_due_date: string
  fee_amount: number
  created_at: string
}

interface Invoice {
  id: number
  invoice_number: string
  company: Company
  invoice_date: string
  due_date: string
  total_amount: number
  dunning_level: number
  dunnings: Dunning[]
}

const API_URL = 'http://localhost:3000/api'
const overdueInvoices = ref<Invoice[]>([])
const loading = ref(false)
const showModal = ref(false)
const selectedInvoice = ref<Invoice | null>(null)
const submitting = ref(false)
const showSuccessToast = ref(false)

interface DunningForm {
  dunning_level: number
  new_due_date: string
  fee_amount: number
}

const dunningForm = ref<DunningForm>({
  dunning_level: 1,
  new_due_date: '',
  fee_amount: 5.00
})

const countByLevel = (level: number) => {
  return overdueInvoices.value.filter(inv => inv.dunning_level === level).length
}

const getDunningClass = (level: number) => {
  if (level === 0) return 'no-dunning'
  if (level === 1) return 'dunning-1'
  if (level === 2) return 'dunning-2'
  if (level === 3) return 'dunning-3'
  return ''
}

const getDaysOverdue = (dueDate: string) => {
  const today = new Date()
  const due = new Date(dueDate)
  const diffTime = today.getTime() - due.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const loadOverdueInvoices = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/dunning/overdue`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    overdueInvoices.value = response.data
  } catch (error) {
    console.error('Error loading overdue invoices:', error)
    alert('Fehler beim Laden der überfälligen Rechnungen')
  } finally {
    loading.value = false
  }
}

const openDunningModal = (invoice: Invoice) => {
  selectedInvoice.value = invoice
  
  // Set default values based on dunning level
  const nextLevel = invoice.dunning_level + 1
  dunningForm.value.dunning_level = nextLevel
  
  // Set suggested fee
  if (nextLevel === 1) dunningForm.value.fee_amount = 5.00
  else if (nextLevel === 2) dunningForm.value.fee_amount = 10.00
  else if (nextLevel === 3) dunningForm.value.fee_amount = 15.00
  
  // Set new due date (14 days from now)
  const newDate = new Date()
  newDate.setDate(newDate.getDate() + 14)
  const isoDate = newDate.toISOString()
  dunningForm.value.new_due_date = isoDate.substring(0, 10)
  
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedInvoice.value = null
}

const createDunning = async () => {
  if (!selectedInvoice.value) return
  
  submitting.value = true
  try {
    const token = localStorage.getItem('token')
    await axios.post(
      `${API_URL}/dunning`,
      {
        invoice_id: selectedInvoice.value.id,
        dunning_level: dunningForm.value.dunning_level,
        new_due_date: dunningForm.value.new_due_date,
        fee_amount: dunningForm.value.fee_amount
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
    
    showSuccessToast.value = true
    setTimeout(() => {
      showSuccessToast.value = false
    }, 3000)
    
    closeModal()
    await loadOverdueInvoices()
  } catch (error) {
    console.error('Error creating dunning:', error)
    alert('Fehler beim Erstellen der Mahnung')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadOverdueInvoices()
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
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.page-header p {
  color: #6b7280;
  margin: 0;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.warning {
  background: #fef3c7;
  color: #d97706;
}

.stat-icon.error {
  background: #fee2e2;
  color: #dc2626;
}

.stat-icon.critical {
  background: #fce7f3;
  color: #be123c;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
}

/* Invoices Section */
.invoices-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading, .empty {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.spinner {
  border: 3px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty svg {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
  color: #d1d5db;
}

/* Table */
.invoices-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f9fafb;
}

th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

tbody tr {
  border-bottom: 1px solid #e5e7eb;
  transition: background 0.2s;
}

tbody tr:hover {
  background: #f9fafb;
}

tbody tr.dunning-1 {
  background: #fef3c7;
}

tbody tr.dunning-2 {
  background: #fee2e2;
}

tbody tr.dunning-3 {
  background: #fce7f3;
}

td {
  padding: 1rem;
  font-size: 0.875rem;
  color: #374151;
}

.days-overdue {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.813rem;
}

.dunning-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.813rem;
}

.dunning-badge.level-0 {
  background: #f3f4f6;
  color: #6b7280;
}

.dunning-badge.level-1 {
  background: #fef3c7;
  color: #d97706;
}

.dunning-badge.level-2 {
  background: #fee2e2;
  color: #dc2626;
}

.dunning-badge.level-3 {
  background: #fce7f3;
  color: #be123c;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-dunning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.813rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-dunning:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-dunning svg {
  width: 16px;
  height: 16px;
}

.max-level {
  color: #6b7280;
  font-size: 0.813rem;
  font-style: italic;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e5e7eb;
}

.close-btn svg {
  width: 18px;
  height: 18px;
  color: #6b7280;
}

.modal-body {
  padding: 1.5rem;
}

.invoice-info {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.info-row .label {
  color: #6b7280;
  font-size: 0.875rem;
}

.info-row .value {
  color: #111827;
  font-weight: 600;
  font-size: 0.875rem;
}

/* Form */
.dunning-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group small {
  font-size: 0.813rem;
  color: #6b7280;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-submit {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease;
  z-index: 1001;
}

.toast.success {
  background: #10b981;
  color: white;
}

.toast svg {
  width: 20px;
  height: 20px;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
