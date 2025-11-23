<template>
  <MainLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Frühzeitige Übernahmen</h1>
          <p>Zusätzliche Übernahmezeiten außerhalb der regulären Zeiten</p>
        </div>
        <button @click="openCreateModal" class="btn-primary">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Neue Übernahme
        </button>
      </div>

      <!-- SUCHFILTER -->
      <div class="filter-section">
        <div class="filter-grid">
          <div class="filter-item">
            <label>Firma</label>
            <select v-model="filters.company_id">
              <option :value="null">Alle Firmen</option>
              <option v-for="company in companies" :key="company.id" :value="company.id">
                {{ company.name }}
              </option>
            </select>
          </div>
          
          <div class="filter-item">
            <label>Von Datum</label>
            <input v-model="filters.start_date" type="date" />
          </div>
          
          <div class="filter-item">
            <label>Bis Datum</label>
            <input v-model="filters.end_date" type="date" />
          </div>
          
          <div class="filter-actions">
            <button @click="applyFilters" class="btn-filter">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Suchen
            </button>
            <button @click="resetFilters" class="btn-reset">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Zurücksetzen
            </button>
          </div>
        </div>
        
        <div v-if="activeFiltersCount > 0" class="active-filters">
          <span class="filter-badge">{{ activeFiltersCount }} Filter aktiv</span>
        </div>
      </div>

      <!-- Übernahmen Liste -->
      <div class="takeovers-grid">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          Lade Übernahmen...
        </div>
        <div v-else-if="filteredTakeovers.length === 0" class="empty">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2"/>
          </svg>
          <p v-if="activeFiltersCount > 0">Keine Übernahmen für die ausgewählten Filter gefunden</p>
          <p v-else>Keine Übernahmen vorhanden</p>
        </div>
        <div v-else v-for="takeover in filteredTakeovers" :key="takeover.id" class="takeover-card">
          <div class="takeover-header">
            <div class="company-badge">{{ takeover.company.name }}</div>
            <button @click="deleteTakeover(takeover)" class="btn-delete-small">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <div class="takeover-dates">
            <div class="date-range">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2"/>
              </svg>
              {{ formatDate(takeover.start_date) }} - {{ formatDate(takeover.end_date) }}
            </div>
            <div class="time-range">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2"/>
              </svg>
              {{ takeover.start_time }} - {{ takeover.end_time }}
            </div>
          </div>
          <div v-if="takeover.notes" class="takeover-notes">
            <strong>Notiz:</strong> {{ takeover.notes }}
          </div>
        </div>
      </div>

      <!-- Modal für neue Übernahme -->
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h2>Neue Übernahme</h2>
            <button @click="closeModal" class="close-btn">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <form @submit.prevent="saveTakeover" class="modal-form">
            <div class="form-group">
              <label>Firma *</label>
              <select v-model="formData.company_id" required>
                <option :value="null">Bitte wählen...</option>
                <option v-for="company in companies" :key="company.id" :value="company.id">
                  {{ company.name }}
                </option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Von (Datum) *</label>
                <input v-model="formData.start_date" type="date" required />
              </div>
              <div class="form-group">
                <label>Bis (Datum) *</label>
                <input v-model="formData.end_date" type="date" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Beginn (Uhrzeit) *</label>
                <input v-model="formData.start_time" type="time" required />
              </div>
              <div class="form-group">
                <label>Ende (Uhrzeit) *</label>
                <input v-model="formData.end_time" type="time" required />
              </div>
            </div>

            <div class="form-group">
              <label>Notiz</label>
              <textarea v-model="formData.notes" rows="3" placeholder="Zusätzliche Informationen..."></textarea>
            </div>

            <div v-if="error" class="error-message">{{ error }}</div>

            <div class="modal-footer">
              <button type="button" @click="closeModal" class="btn-secondary">Abbrechen</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Speichern...' : 'Speichern' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import axios from 'axios'

interface Company {
  id: number
  name: string
}

interface Takeover {
  id: number
  company_id: number
  company: Company
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  notes: string | null
  created_at: string
}

const takeovers = ref<Takeover[]>([])
const companies = ref<Company[]>([])
const loading = ref(false)
const showModal = ref(false)
const saving = ref(false)
const error = ref('')

const filters = ref({
  company_id: null as number | null,
  start_date: '',
  end_date: ''
})

const formData = ref({
  company_id: null as number | null,
  start_date: '',
  end_date: '',
  start_time: '',
  end_time: '',
  notes: ''
})

const filteredTakeovers = computed(() => {
  let result = takeovers.value

  // Filter nach Firma
  if (filters.value.company_id) {
    result = result.filter(t => t.company_id === filters.value.company_id)
  }

  // Filter nach Zeitraum
  if (filters.value.start_date) {
    result = result.filter(t => {
      const takeoverEnd = new Date(t.end_date)
      const filterStart = new Date(filters.value.start_date)
      return takeoverEnd >= filterStart
    })
  }

  if (filters.value.end_date) {
    result = result.filter(t => {
      const takeoverStart = new Date(t.start_date)
      const filterEnd = new Date(filters.value.end_date)
      return takeoverStart <= filterEnd
    })
  }

  return result
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.company_id) count++
  if (filters.value.start_date) count++
  if (filters.value.end_date) count++
  return count
})

async function fetchTakeovers() {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('http://188.245.198.220:3000/api/takeovers', {
      headers: { Authorization: `Bearer ${token}` }
    })
    takeovers.value = response.data
  } catch (err) {
    console.error('Error fetching takeovers:', err)
  } finally {
    loading.value = false
  }
}

async function fetchCompanies() {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('http://188.245.198.220:3000/api/companies', {
      headers: { Authorization: `Bearer ${token}` },
      params: { active: 'true' }
    })
    companies.value = response.data
  } catch (err) {
    console.error('Error fetching companies:', err)
  }
}

function applyFilters() {
  // Die computed property filteredTakeovers aktualisiert sich automatisch
}

function resetFilters() {
  filters.value = {
    company_id: null,
    start_date: '',
    end_date: ''
  }
}

function openCreateModal() {
  formData.value = {
    company_id: null,
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    notes: ''
  }
  error.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function saveTakeover() {
  saving.value = true
  error.value = ''

  try {
    const token = localStorage.getItem('token')
    await axios.post(
      'http://188.245.198.220:3000/api/takeovers',
      formData.value,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    await fetchTakeovers()
    closeModal()
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Fehler beim Speichern'
  } finally {
    saving.value = false
  }
}

async function deleteTakeover(takeover: Takeover) {
  if (!confirm(`Möchten Sie diese Übernahme wirklich löschen?`)) return

  try {
    const token = localStorage.getItem('token')
    await axios.delete(
      `http://188.245.198.220:3000/api/takeovers/${takeover.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    await fetchTakeovers()
  } catch (err: any) {
    alert(err.response?.data?.error || 'Fehler beim Löschen')
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(() => {
  fetchTakeovers()
  fetchCompanies()
})
</script>

<style scoped>
.page-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}

.page-header p {
  color: #6b7280;
  font-size: 0.875rem;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(245, 158, 11, 0.3);
}

.btn-primary svg {
  width: 18px;
  height: 18px;
}

/* FILTER SECTION */
.filter-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 1rem;
  align-items: end;
}

.filter-item label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.filter-item select,
.filter-item input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.filter-item select:focus,
.filter-item input:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-filter,
.btn-reset {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn-filter {
  background: #3b82f6;
  color: white;
  border: none;
}

.btn-filter:hover {
  background: #2563eb;
}

.btn-reset {
  background: white;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.btn-reset:hover {
  background: #f3f4f6;
}

.btn-filter svg,
.btn-reset svg {
  width: 16px;
  height: 16px;
}

.active-filters {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.filter-badge {
  display: inline-block;
  background: #dbeafe;
  color: #1e40af;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.takeovers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.loading, .empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
  color: #9ca3af;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty svg {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  color: #d1d5db;
}

.takeover-card {
  background: white;
  border: 2px solid #fbbf24;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s;
}

.takeover-card:hover {
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.15);
  transform: translateY(-2px);
}

.takeover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.company-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
}

.btn-delete-small {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #fee2e2;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete-small:hover {
  background: #fee2e2;
  border-color: #ef4444;
}

.btn-delete-small svg {
  width: 16px;
  height: 16px;
  color: #ef4444;
}

.takeover-dates {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.date-range, .time-range {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #374151;
}

.date-range svg, .time-range svg {
  width: 18px;
  height: 18px;
  color: #f59e0b;
  flex-shrink: 0;
}

.takeover-notes {
  background: #fef3c7;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #78350f;
}

.takeover-notes strong {
  display: block;
  margin-bottom: 0.25rem;
}

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
  padding: 2rem;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.close-btn {
  width: 36px;
  height: 36px;
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
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.modal-form {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.error-message {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 1rem 1.25rem;
  border-radius: 10px;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  color: #374151;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f3f4f6;
}
</style>
