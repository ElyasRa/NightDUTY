<template>
  <MainLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Mahnwesen</h1>
          <p>Überfällige Rechnungen und Mahnungen verwalten</p>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Lade überfällige Rechnungen...</p>
      </div>

      <!-- ERROR -->
      <div v-else-if="error" class="error-box">
        <p>{{ error }}</p>
        <button @click="loadOverdueInvoices" class="btn-primary">Erneut versuchen</button>
      </div>

      <!-- CONTENT -->
      <div v-else class="content-box">
        <div v-if="overdueInvoices.length === 0" class="empty-state">
          <div class="empty-icon">✅</div>
          <h2>Keine überfälligen Rechnungen</h2>
          <p>Alle Rechnungen sind aktuell bezahlt oder nicht überfällig.</p>
        </div>

        <div v-else>
          <div class="stats-row">
            <div class="stat-card">
              <div class="stat-label">Überfällige Rechnungen</div>
              <div class="stat-value">{{ overdueInvoices.length }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Offener Betrag</div>
              <div class="stat-value">{{ totalOverdueAmount.toFixed(2) }} €</div>
            </div>
          </div>

          <div class="table-container">
            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Rechnungsnummer</th>
                  <th>Firma</th>
                  <th>Kundennummer</th>
                  <th>Betrag</th>
                  <th>Fällig am</th>
                  <th>Überfällig seit</th>
                  <th>Mahnstufe</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="invoice in overdueInvoices" :key="invoice.id">
                  <td><strong>{{ invoice.invoice_number }}</strong></td>
                  <td>{{ invoice.company.name }}</td>
                  <td>{{ invoice.company.customer_number || '-' }}</td>
                  <td class="amount">{{ invoice.total_amount.toFixed(2) }} €</td>
                  <td>{{ formatDate(invoice.due_date) }}</td>
                  <td>
                    <span class="overdue-badge" :class="getOverdueClass(invoice.due_date)">
                      {{ getDaysOverdue(invoice.due_date) }} Tage
                    </span>
                  </td>
                  <td>
                    <span class="dunning-badge" :class="'level-' + invoice.dunning_level">
                      {{ invoice.dunning_level === 0 ? 'Keine' : 'Stufe ' + invoice.dunning_level }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button 
                        v-if="invoice.dunning_level < 3"
                        @click="openDunningDialog(invoice)" 
                        class="btn-action"
                        :class="'btn-level-' + (invoice.dunning_level + 1)">
                        {{ getDunningButtonText(invoice.dunning_level) }}
                      </button>
                      <button 
                        v-if="invoice.dunnings && invoice.dunnings.length > 0"
                        @click="viewDunnings(invoice)" 
                        class="btn-view">
                        Historie
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- DUNNING DIALOG -->
    <div v-if="showDunningDialog" class="modal-overlay" @click.self="closeDunningDialog">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ getDunningTitle() }}</h2>
          <button @click="closeDunningDialog" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="invoice-info">
            <div class="info-row">
              <span class="label">Rechnung:</span>
              <span class="value">{{ selectedInvoice?.invoice_number }}</span>
            </div>
            <div class="info-row">
              <span class="label">Firma:</span>
              <span class="value">{{ selectedInvoice?.company.name }}</span>
            </div>
            <div class="info-row">
              <span class="label">Betrag:</span>
              <span class="value">{{ selectedInvoice?.total_amount.toFixed(2) }} €</span>
            </div>
            <div class="info-row">
              <span class="label">Überfällig seit:</span>
              <span class="value">{{ getDaysOverdue(selectedInvoice?.due_date) }} Tagen</span>
            </div>
          </div>

          <div class="form-section">
            <div class="form-group">
              <label>Neue Fälligkeit *</label>
              <input v-model="dunningForm.new_due_date" type="date" required />
            </div>

            <div class="form-group">
              <label>Mahngebühr (€) *</label>
              <input v-model="dunningForm.fee_amount" type="number" step="0.01" min="0" required />
              <small class="hint">Empfohlen: {{ getRecommendedFee() }} €</small>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeDunningDialog" class="btn-secondary">Abbrechen</button>
          <button 
            @click="createDunning" 
            class="btn-primary"
            :disabled="creatingDunning">
            {{ creatingDunning ? 'Erstelle...' : 'Mahnung erstellen' }}
          </button>
        </div>
      </div>
    </div>

    <!-- DUNNING HISTORY DIALOG -->
    <div v-if="showHistoryDialog" class="modal-overlay" @click.self="closeHistoryDialog">
      <div class="modal-content history-modal">
        <div class="modal-header">
          <h2>Mahnhistorie</h2>
          <button @click="closeHistoryDialog" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="invoice-info">
            <div class="info-row">
              <span class="label">Rechnung:</span>
              <span class="value">{{ selectedInvoice?.invoice_number }}</span>
            </div>
            <div class="info-row">
              <span class="label">Firma:</span>
              <span class="value">{{ selectedInvoice?.company.name }}</span>
            </div>
          </div>

          <div class="history-list">
            <div 
              v-for="dunning in selectedInvoice?.dunnings" 
              :key="dunning.id" 
              class="history-item">
              <div class="history-header">
                <span class="dunning-level-badge" :class="'level-' + dunning.dunning_level">
                  Mahnstufe {{ dunning.dunning_level }}
                </span>
                <span class="history-date">{{ formatDate(dunning.dunning_date) }}</span>
              </div>
              <div class="history-details">
                <div class="detail-row">
                  <span>Neue Fälligkeit:</span>
                  <strong>{{ formatDate(dunning.new_due_date) }}</strong>
                </div>
                <div class="detail-row">
                  <span>Mahngebühr:</span>
                  <strong>{{ dunning.fee_amount.toFixed(2) }} €</strong>
                </div>
                <div class="detail-row" v-if="dunning.created_by">
                  <span>Erstellt von:</span>
                  <strong>{{ dunning.created_by }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeHistoryDialog" class="btn-secondary">Schließen</button>
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
  customer_number?: string
  email?: string
  contact_person?: string
}

interface Dunning {
  id: number
  invoice_id: number
  dunning_level: number
  dunning_date: string
  new_due_date: string
  fee_amount: number
  created_by?: string
  created_at: string
}

interface Invoice {
  id: number
  invoice_number: string
  company: Company
  total_amount: number
  due_date: string
  dunning_level: number
  dunnings?: Dunning[]
}

const API_URL = 'http://188.245.198.220:3000/api'
const loading = ref(true)
const error = ref('')
const overdueInvoices = ref<Invoice[]>([])
const showDunningDialog = ref(false)
const showHistoryDialog = ref(false)
const selectedInvoice = ref<Invoice | null>(null)
const creatingDunning = ref(false)

const dunningForm = ref({
  new_due_date: '',
  fee_amount: 0
})

const totalOverdueAmount = computed(() => {
  return overdueInvoices.value.reduce((sum, inv) => sum + inv.total_amount, 0)
})

onMounted(() => {
  loadOverdueInvoices()
})

async function loadOverdueInvoices() {
  loading.value = true
  error.value = ''
  
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/dunning`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    overdueInvoices.value = response.data
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Fehler beim Laden der Rechnungen'
    console.error('Error loading overdue invoices:', err)
  } finally {
    loading.value = false
  }
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function getDaysOverdue(dueDateString: string | undefined): number {
  if (!dueDateString) return 0
  const dueDate = new Date(dueDateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)
  const diffTime = today.getTime() - dueDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

function getOverdueClass(dueDateString: string | undefined): string {
  const days = getDaysOverdue(dueDateString)
  if (days > 60) return 'severe'
  if (days > 30) return 'warning'
  return 'mild'
}

function getDunningButtonText(currentLevel: number): string {
  const nextLevel = currentLevel + 1
  return `Mahnung ${nextLevel}. Stufe`
}

function getDunningTitle(): string {
  if (!selectedInvoice.value) return ''
  const nextLevel = selectedInvoice.value.dunning_level + 1
  return `Mahnung ${nextLevel}. Stufe erstellen`
}

function getRecommendedFee(): number {
  if (!selectedInvoice.value) return 0
  const level = selectedInvoice.value.dunning_level + 1
  // Recommended fees per dunning level
  const fees: { [key: number]: number } = {
    1: 2.50,
    2: 5.00,
    3: 10.00
  }
  return fees[level] || 0
}

function openDunningDialog(invoice: Invoice) {
  selectedInvoice.value = invoice
  
  // Set default values
  const today = new Date()
  today.setDate(today.getDate() + 7) // 7 days from now
  const dateParts = today.toISOString().split('T')
  dunningForm.value.new_due_date = dateParts[0] ?? ''
  dunningForm.value.fee_amount = getRecommendedFee()
  
  showDunningDialog.value = true
}

function closeDunningDialog() {
  showDunningDialog.value = false
  selectedInvoice.value = null
  dunningForm.value = {
    new_due_date: '',
    fee_amount: 0
  }
}

async function createDunning() {
  if (!selectedInvoice.value) return
  
  if (!dunningForm.value.new_due_date) {
    alert('Neue Fälligkeit ist erforderlich.')
    return
  }
  
  if (dunningForm.value.fee_amount < 0) {
    alert('Mahngebühr darf nicht negativ sein.')
    return
  }
  
  creatingDunning.value = true
  
  try {
    const token = localStorage.getItem('token')
    const nextLevel = selectedInvoice.value.dunning_level + 1
    
    await axios.post(`${API_URL}/dunning`, {
      invoice_id: selectedInvoice.value.id,
      dunning_level: nextLevel,
      new_due_date: dunningForm.value.new_due_date,
      fee_amount: dunningForm.value.fee_amount
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    alert('Mahnung erfolgreich erstellt!')
    closeDunningDialog()
    loadOverdueInvoices()
  } catch (err: any) {
    alert(err.response?.data?.error || 'Fehler beim Erstellen der Mahnung')
    console.error('Error creating dunning:', err)
  } finally {
    creatingDunning.value = false
  }
}

function viewDunnings(invoice: Invoice) {
  selectedInvoice.value = invoice
  showHistoryDialog.value = true
}

function closeHistoryDialog() {
  showHistoryDialog.value = false
  selectedInvoice.value = null
}
</script>

<style scoped>
.page-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #0a0a0a 100%);
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #ff006e;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
}

.page-header p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  margin: 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.7);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #ff006e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-box {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  backdrop-filter: blur(10px);
}

.error-box p {
  color: #ff4444;
  margin: 0 0 1rem 0;
}

.content-box {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  padding: 1.5rem;
  border-radius: 12px;
  color: white;
  box-shadow: 0 8px 24px rgba(255, 0, 110, 0.3);
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
}

.table-container {
  overflow-x: auto;
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
}

.invoice-table th {
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.invoice-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

.invoice-table tr:hover {
  background: rgba(255, 255, 255, 0.05);
}

.amount {
  font-weight: 600;
  color: #ffffff;
}

.overdue-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.overdue-badge.mild {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.overdue-badge.warning {
  background: rgba(249, 115, 22, 0.2);
  color: #f97316;
  border: 1px solid rgba(249, 115, 22, 0.3);
}

.overdue-badge.severe {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.dunning-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.dunning-badge.level-0 {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dunning-badge.level-1 {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.dunning-badge.level-2 {
  background: rgba(249, 115, 22, 0.2);
  color: #f97316;
  border: 1px solid rgba(249, 115, 22, 0.3);
}

.dunning-badge.level-3 {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.btn-action.btn-level-1 {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
}

.btn-action.btn-level-1:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(251, 191, 36, 0.4);
}

.btn-action.btn-level-2 {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
}

.btn-action.btn-level-2:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(249, 115, 22, 0.4);
}

.btn-action.btn-level-3 {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-action.btn-level-3:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
}

.btn-view {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.7);
}

.btn-view:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #ff006e;
  color: #ff006e;
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
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 0, 110, 0.2);
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

.modal-content.history-modal {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ff006e;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.modal-body {
  padding: 1.5rem;
}

.invoice-info {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.info-row:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.info-row .label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
}

.info-row .value {
  font-weight: 600;
  color: #ffffff;
  font-size: 0.875rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
}

.form-group input {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 0.875rem;
  color: #ffffff;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #ff006e;
  box-shadow: 0 0 0 3px rgba(255, 0, 110, 0.15);
  background: rgba(255, 255, 255, 0.08);
}

.hint {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  color: white;
  box-shadow: 0 8px 24px rgba(255, 0, 110, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(255, 0, 110, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.dunning-level-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.dunning-level-badge.level-1 {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.dunning-level-badge.level-2 {
  background: rgba(249, 115, 22, 0.2);
  color: #f97316;
  border: 1px solid rgba(249, 115, 22, 0.3);
}

.dunning-level-badge.level-3 {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.history-date {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
}

.history-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
}

.detail-row strong {
  color: #ffffff;
}
</style>
