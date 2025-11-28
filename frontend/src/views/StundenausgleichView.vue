<template>
  <MainLayout>
    <!-- PIN Modal -->
    <div v-if="showPinModal" class="modal-overlay" @click="closePinModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>🔐 Zugang erforderlich</h2>
          <button @click="closePinModal" class="close-btn">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <form @submit.prevent="verifyPin" class="modal-form">
          <div class="form-group">
            <label>PIN-Code eingeben</label>
            <input 
              v-model="pinInput" 
              type="password" 
              placeholder="PIN eingeben..." 
              required 
              autofocus
              maxlength="10"
            />
          </div>
          <div v-if="pinError" class="error-message">{{ pinError }}</div>
          <div class="modal-footer">
            <button type="button" @click="goBack" class="btn-secondary">Zurück</button>
            <button type="submit" class="btn-primary">Bestätigen</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Main Content (only shown after PIN verification) -->
    <div v-if="pinVerified" class="page-container">
      <div class="page-header">
        <div>
          <h1>⏰ Stundenausgleich</h1>
          <p>Zusätzliche Stunden für den Stundenreport erfassen</p>
        </div>
      </div>

      <!-- Form Card -->
      <div class="form-card">
        <form @submit.prevent="saveCompensation">
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

          <div class="form-group">
            <label>Gesamtstunden *</label>
            <input 
              v-model.number="formData.total_hours" 
              type="number" 
              step="0.01" 
              min="0.01"
              placeholder="z.B. 10.5"
              required 
            />
            <span class="form-hint">Diese Stunden werden gleichmäßig auf alle Tage im Zeitraum verteilt.</span>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>
          <div v-if="success" class="success-message">{{ success }}</div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Speichern...' : 'Stundenausgleich speichern' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Existing Compensations List -->
      <div class="compensations-section">
        <h2>Gespeicherte Stundenausgleiche</h2>
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          Lade Stundenausgleiche...
        </div>
        <div v-else-if="compensations.length === 0" class="empty-state">
          <p>Keine Stundenausgleiche vorhanden.</p>
        </div>
        <div v-else class="compensations-grid">
          <div v-for="comp in compensations" :key="comp.id" class="compensation-card">
            <div class="compensation-header">
              <div class="company-badge">{{ comp.company.name }}</div>
              <button @click="deleteCompensation(comp)" class="btn-delete-small">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>
            <div class="compensation-dates">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2"/>
              </svg>
              {{ formatDate(comp.start_date) }} - {{ formatDate(comp.end_date) }}
            </div>
            <div class="compensation-hours">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2"/>
              </svg>
              {{ comp.total_hours }} Stunden
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const PIN_CODE = '180563'

interface Company {
  id: number
  name: string
}

interface Compensation {
  id: number
  company_id: number
  company: Company
  start_date: string
  end_date: string
  total_hours: number
  created_at: string
}

const router = useRouter()

const showPinModal = ref(true)
const pinVerified = ref(false)
const pinInput = ref('')
const pinError = ref('')

const companies = ref<Company[]>([])
const compensations = ref<Compensation[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')

const formData = ref({
  company_id: null as number | null,
  start_date: '',
  end_date: '',
  total_hours: null as number | null
})

function verifyPin() {
  pinError.value = ''
  if (pinInput.value === PIN_CODE) {
    pinVerified.value = true
    showPinModal.value = false
    fetchCompanies()
    fetchCompensations()
  } else {
    pinError.value = 'Falscher PIN-Code'
  }
}

function closePinModal() {
  router.push('/dashboard')
}

function goBack() {
  router.push('/dashboard')
}

async function fetchCompanies() {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE_URL}/companies`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { active: 'true' }
    })
    companies.value = response.data
  } catch (err) {
    console.error('Error fetching companies:', err)
  }
}

async function fetchCompensations() {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE_URL}/compensation`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    compensations.value = response.data
  } catch (err) {
    console.error('Error fetching compensations:', err)
    compensations.value = []
  } finally {
    loading.value = false
  }
}

async function saveCompensation() {
  error.value = ''
  success.value = ''

  // Validation: start date before end date
  if (formData.value.start_date && formData.value.end_date) {
    const startDate = new Date(formData.value.start_date)
    const endDate = new Date(formData.value.end_date)
    if (startDate > endDate) {
      error.value = 'Startdatum muss vor dem Enddatum liegen'
      return
    }
  }

  saving.value = true

  try {
    const token = localStorage.getItem('token')
    await axios.post(
      `${API_BASE_URL}/compensation`,
      formData.value,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
    success.value = 'Stundenausgleich erfolgreich gespeichert!'
    
    // Reset form
    formData.value = {
      company_id: null,
      start_date: '',
      end_date: '',
      total_hours: null
    }
    
    // Refresh list
    await fetchCompensations()
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      success.value = ''
    }, 3000)
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Fehler beim Speichern'
  } finally {
    saving.value = false
  }
}

async function deleteCompensation(comp: Compensation) {
  if (!confirm(`Möchten Sie diesen Stundenausgleich wirklich löschen?`)) return

  try {
    const token = localStorage.getItem('token')
    await axios.delete(
      `${API_BASE_URL}/compensation/${comp.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    await fetchCompensations()
  } catch (err: any) {
    alert(err.response?.data?.error || 'Fehler beim Löschen')
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(() => {
  // Show PIN modal on mount
  showPinModal.value = true
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
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
}

/* Form Card */
.form-card {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 0.875rem;
  background: rgba(15, 23, 42, 0.8);
  color: #ffffff;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #ff006e;
  box-shadow: 0 0 0 3px rgba(255, 0, 110, 0.15);
  background: rgba(30, 41, 59, 0.9);
}

.form-group select option {
  background: #1e293b;
  color: #ffffff;
}

.form-hint {
  display: block;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 8px 24px rgba(255, 0, 110, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(255, 0, 110, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 1rem 1.25rem;
  border-radius: 10px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.success-message {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
  padding: 1rem 1.25rem;
  border-radius: 10px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

/* Compensations Section */
.compensations-section {
  margin-top: 2rem;
}

.compensations-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 1rem;
}

.compensations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.compensation-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 0, 110, 0.3);
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.3s;
}

.compensation-card:hover {
  box-shadow: 0 8px 32px rgba(255, 0, 110, 0.2);
  transform: translateY(-2px);
  border-color: rgba(255, 0, 110, 0.5);
}

.compensation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.company-badge {
  background: linear-gradient(135deg, rgba(255, 0, 110, 0.15) 0%, rgba(131, 56, 236, 0.15) 100%);
  border: 1px solid rgba(255, 0, 110, 0.3);
  color: #ff006e;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
}

.btn-delete-small {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete-small:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
}

.btn-delete-small svg {
  width: 16px;
  height: 16px;
  color: #ef4444;
}

.compensation-dates,
.compensation-hours {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
}

.compensation-dates svg,
.compensation-hours svg {
  width: 18px;
  height: 18px;
  color: #ff006e;
  flex-shrink: 0;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.6);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #ff006e;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
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
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal {
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.close-btn svg {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.7);
}

.modal-form {
  padding: 2rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .compensations-grid {
    grid-template-columns: 1fr;
  }
}
</style>
