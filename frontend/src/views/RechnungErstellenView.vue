<template>
  <MainLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Rechnung erstellen</h1>
          <p>Erstellen Sie eine neue Rechnung für einen Kunden</p>
        </div>
      </div>

      <!-- ERFOLG -->
      <div v-if="createdInvoice" class="success-container">
        <div class="success-box">
          <div class="success-icon">✅</div>
          <h2>Rechnung erfolgreich erstellt!</h2>
          <p class="invoice-number">{{ createdInvoice.invoice_number }}</p>
          
          <div class="success-details">
            <div class="detail-item">
              <span class="detail-label">Firma:</span>
              <span class="detail-value">{{ createdInvoice.company.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Betrag:</span>
              <span class="detail-value">{{ createdInvoice.total_amount.toFixed(2) }} €</span>
            </div>
          </div>
          
          <div class="success-actions">
            <button @click="downloadPDF" class="btn-download" :disabled="downloading">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              {{ downloading ? 'Lädt...' : 'PDF herunterladen' }}
            </button>
            <button @click="createAnother" class="btn-secondary">Weitere Rechnung erstellen</button>
            <button @click="$router.push('/dashboard')" class="btn-secondary">Zum Dashboard</button>
          </div>
        </div>
      </div>

      <!-- FORMULAR -->
      <div v-else class="form-container">
        <form @submit.prevent="createInvoice" class="invoice-form">
          <div class="form-section">
            <h2>1. Firma & Zeitraum</h2>
            
            <div class="form-group">
              <label>Firma *</label>
              <select v-model="formData.company_id" @change="onCompanyChange" required>
                <option :value="null">Bitte wählen...</option>
                <option v-for="company in companies" :key="company.id" :value="company.id">
                  {{ company.name }}
                </option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Leistungszeitraum Von *</label>
                <input v-model="formData.period_start" type="date" @change="calculateHours" required />
              </div>
              <div class="form-group">
                <label>Leistungszeitraum Bis *</label>
                <input v-model="formData.period_end" type="date" @change="calculateHours" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Rechnungsdatum *</label>
                <input v-model="formData.invoice_date" type="date" required />
              </div>
              <div class="form-group">
                <label>Fällig am *</label>
                <input v-model="formData.due_date" type="date" required />
              </div>
            </div>
          </div>

          <div v-if="selectedCompany" class="form-section">
            <h2>2. Abrechnungsdetails</h2>
            
            <div v-if="selectedCompany.billing_type === 'hourly'" class="billing-section hourly">
              <div class="billing-icon">⏱️</div>
              <div>
                <h3>Stundenabrechnung</h3>
                <p>Stundensatz: <strong>{{ selectedCompany.hourly_rate?.toFixed(2) }} €</strong></p>
              </div>
            </div>

            <div v-if="selectedCompany.billing_type === 'hourly'" class="hours-display">
              <div class="hours-box">
                <div v-if="calculatingHours" class="calculating">
                  <div class="mini-spinner"></div>
                  Berechne Stunden...
                </div>
                <div v-else-if="formData.total_hours > 0" class="hours-result">
                  <div class="hours-icon">📊</div>
                  <div class="hours-details">
                    <div class="hours-label">Automatisch berechnete Stunden</div>
                    <div class="hours-value">{{ formData.total_hours.toFixed(2) }} Stunden</div>
                    <div class="hours-breakdown">
                      <div class="hours-breakdown-item">
                        <span class="breakdown-label">Reguläre Stunden:</span>
                        <span class="breakdown-value">{{ (formData.regular_hours + formData.holiday_hours).toFixed(2) }} h</span>
                        <span class="breakdown-rate" v-if="selectedCompany.hourly_rate">@ {{ selectedCompany.hourly_rate.toFixed(2) }} €</span>
                      </div>
                      <div v-if="formData.takeover_hours > 0" class="hours-breakdown-item takeover">
                        <span class="breakdown-label">Frühzeitige Übernahme:</span>
                        <span class="breakdown-value">{{ formData.takeover_hours.toFixed(2) }} h</span>
                        <span class="breakdown-rate" v-if="selectedCompany.early_takeover_price">@ {{ selectedCompany.early_takeover_price.toFixed(2) }} €</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="hours-placeholder">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  <p>Wählen Sie einen Zeitraum aus</p>
                </div>
              </div>
            </div>

            <div v-if="selectedCompany.billing_type === 'per_job'" class="billing-section per-job">
              <div class="billing-icon">✅</div>
              <div>
                <h3>Abrechnung pro Auftrag</h3>
                <p>Tragen Sie die Anzahl der Einsätze ein</p>
              </div>
            </div>

            <div v-if="selectedCompany.billing_type === 'per_job'" class="jobs-grid">
              <div v-if="selectedCompany.price_pkw" class="job-item">
                <div class="job-header">
                  <span class="job-icon">🚗</span>
                  <div>
                    <strong>PKW-Bergung</strong>
                    <span class="job-price">{{ selectedCompany.price_pkw.toFixed(2) }} € / Stück</span>
                  </div>
                </div>
                <input v-model.number="formData.count_pkw" type="number" min="0" placeholder="Anzahl" />
              </div>

              <div v-if="selectedCompany.price_lkw" class="job-item">
                <div class="job-header">
                  <span class="job-icon">🚛</span>
                  <div>
                    <strong>LKW-Bergung</strong>
                    <span class="job-price">{{ selectedCompany.price_lkw.toFixed(2) }} € / Stück</span>
                  </div>
                </div>
                <input v-model.number="formData.count_lkw" type="number" min="0" placeholder="Anzahl" />
              </div>

              <div v-if="selectedCompany.price_oilspill" class="job-item">
                <div class="job-header">
                  <span class="job-icon">🛢️</span>
                  <div>
                    <strong>Ölspur-Beseitigung</strong>
                    <span class="job-price">{{ selectedCompany.price_oilspill.toFixed(2) }} € / Stück</span>
                  </div>
                </div>
                <input v-model.number="formData.count_oilspill" type="number" min="0" placeholder="Anzahl" />
              </div>
            </div>

            <div v-if="selectedCompany.billing_type === 'flat_rate' && selectedCompany.monthly_rate" class="billing-section flat-rate">
              <div class="billing-icon">📅</div>
              <div>
                <h3>Rufbereitschaftsdienst Monatspauschale</h3>
                <p>Monatlicher Pauschalbetrag: <strong>{{ (selectedCompany.monthly_rate || 0).toFixed(2) }} €</strong></p>
              </div>
            </div>
          </div>

          <div v-if="selectedCompany && calculatedSubtotal > 0" class="form-section">
            <h2>3. Zusammenfassung</h2>
            
            <div class="summary-box">
              <div class="summary-row">
                <span>Nettobetrag:</span>
                <strong>{{ calculatedSubtotal.toFixed(2) }} €</strong>
              </div>
              <div class="summary-row">
                <span>MwSt. (19%):</span>
                <strong>{{ calculatedTax.toFixed(2) }} €</strong>
              </div>
              <div class="summary-row total">
                <span>Gesamtbetrag:</span>
                <strong>{{ calculatedTotal.toFixed(2) }} €</strong>
              </div>
            </div>

            <div class="form-group">
              <label>Notizen (optional)</label>
              <textarea v-model="formData.notes" rows="3" placeholder="Zusätzliche Informationen..."></textarea>
            </div>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>

          <div class="form-actions">
            <button type="button" @click="$router.push('/dashboard')" class="btn-secondary">Abbrechen</button>
            <button type="submit" class="btn-primary" :disabled="saving || !selectedCompany || calculatedSubtotal === 0">
              {{ saving ? 'Erstelle Rechnung...' : 'Rechnung erstellen' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import axios from 'axios'

const router = useRouter()

interface Company {
  id: number
  name: string
  billing_type?: string
  hourly_rate?: number
  price_pkw?: number
  price_lkw?: number
  price_oilspill?: number
  service_fee?: number
  monthly_rate?: number
  early_takeover_price?: number
}

const companies = ref<Company[]>([])
const selectedCompany = ref<Company | null>(null)
const saving = ref(false)
const error = ref('')
const calculatingHours = ref(false)
const createdInvoice = ref<any>(null)
const downloading = ref(false)

const formData = ref({
  company_id: null as number | null,
  period_start: '',
  period_end: '',
  invoice_date: new Date().toISOString().split('T')[0],
  due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  total_hours: 0,
  regular_hours: 0,
  takeover_hours: 0,
  holiday_hours: 0,
  count_pkw: 0,
  count_lkw: 0,
  count_oilspill: 0,
  notes: ''
})

const calculatedSubtotal = computed(() => {
  if (!selectedCompany.value) return 0
  
  let subtotal = 0
  
  if (selectedCompany.value.billing_type === 'hourly') {
    // Use regular + holiday hours for standard hourly rate (not total_hours to avoid double counting takeover)
    const standardHours = (formData.value.regular_hours || 0) + (formData.value.holiday_hours || 0)
    subtotal = standardHours * (selectedCompany.value.hourly_rate || 0)
  } else if (selectedCompany.value.billing_type === 'per_job') {
    subtotal = (
      (formData.value.count_pkw || 0) * (selectedCompany.value.price_pkw || 0) +
      (formData.value.count_lkw || 0) * (selectedCompany.value.price_lkw || 0) +
      (formData.value.count_oilspill || 0) * (selectedCompany.value.price_oilspill || 0)
    )
  } else if (selectedCompany.value.billing_type === 'flat_rate') {
    subtotal = selectedCompany.value.monthly_rate || 0
  }
  
  // Add takeover hours to subtotal if applicable
  if (formData.value.takeover_hours > 0 && selectedCompany.value.early_takeover_price) {
    subtotal += formData.value.takeover_hours * selectedCompany.value.early_takeover_price
  }
  
  return subtotal
})

const calculatedTax = computed(() => calculatedSubtotal.value * 0.19)
const calculatedTotal = computed(() => calculatedSubtotal.value + calculatedTax.value)

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

function onCompanyChange() {
  selectedCompany.value = companies.value.find(c => c.id === formData.value.company_id) || null
  formData.value.total_hours = 0
  formData.value.regular_hours = 0
  formData.value.takeover_hours = 0
  formData.value.holiday_hours = 0
  formData.value.count_pkw = 0
  formData.value.count_lkw = 0
  formData.value.count_oilspill = 0
  
  if (selectedCompany.value?.billing_type === 'hourly' && formData.value.period_start && formData.value.period_end) {
    calculateHours()
  }
}

async function calculateHours() {
  if (!selectedCompany.value || selectedCompany.value.billing_type !== 'hourly') return
  if (!formData.value.period_start || !formData.value.period_end) return
  
  calculatingHours.value = true
  
  try {
    const token = localStorage.getItem('token')
    const response = await axios.post(
      'http://188.245.198.220:3000/api/invoices/calculate-hours',
      {
        company_id: formData.value.company_id,
        start_date: formData.value.period_start,
        end_date: formData.value.period_end
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
    formData.value.total_hours = response.data.total_hours
    formData.value.regular_hours = response.data.regular_hours
    formData.value.takeover_hours = response.data.takeover_hours
    formData.value.holiday_hours = response.data.holiday_hours
  } catch (err) {
    console.error('Error calculating hours:', err)
    error.value = 'Fehler beim Berechnen der Stunden'
  } finally {
    calculatingHours.value = false
  }
}

async function createInvoice() {
  if (!selectedCompany.value) return
  
  saving.value = true
  error.value = ''

  try {
    const token = localStorage.getItem('token')
    
    const payload = {
      company_id: formData.value.company_id,
      period_start: formData.value.period_start,
      period_end: formData.value.period_end,
      invoice_date: formData.value.invoice_date,
      due_date: formData.value.due_date,
      billing_type: selectedCompany.value.billing_type,
      notes: formData.value.notes
    }
    
    if (selectedCompany.value.billing_type === 'hourly') {
      // Send standard hours (regular + holiday) as total_hours, not including takeover
      const standardHours = (formData.value.regular_hours || 0) + (formData.value.holiday_hours || 0)
      Object.assign(payload, {
        total_hours: standardHours,
        hourly_rate: selectedCompany.value.hourly_rate
      })
    } else if (selectedCompany.value.billing_type === 'per_job') {
      Object.assign(payload, {
        count_pkw: formData.value.count_pkw,
        count_lkw: formData.value.count_lkw,
        count_oilspill: formData.value.count_oilspill,
        price_pkw: selectedCompany.value.price_pkw,
        price_lkw: selectedCompany.value.price_lkw,
        price_oilspill: selectedCompany.value.price_oilspill
      })
    } else if (selectedCompany.value.billing_type === 'flat_rate') {
      Object.assign(payload, {
        monthly_rate: selectedCompany.value.monthly_rate
      })
    }
    
    // Service-Pauschale hinzufügen (falls vorhanden)
    if (selectedCompany.value.service_fee) {
      Object.assign(payload, {
        service_fee: selectedCompany.value.service_fee
      })
    }
    
    // Takeover hours hinzufügen (falls vorhanden)
    if (formData.value.takeover_hours > 0) {
      Object.assign(payload, {
        takeover_hours: formData.value.takeover_hours
      })
    }
    
    const response = await axios.post(
      'http://188.245.198.220:3000/api/invoices',
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
    createdInvoice.value = response.data
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Fehler beim Erstellen der Rechnung'
  } finally {
    saving.value = false
  }
}

async function downloadPDF() {
  if (!createdInvoice.value) return
  
  downloading.value = true
  
  try {
    const token = localStorage.getItem('token')
    
    const response = await axios.get(
      `http://188.245.198.220:3000/api/invoices/${createdInvoice.value.id}/pdf`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob'
      }
    )
    
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Rechnung_${createdInvoice.value.invoice_number}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Error downloading PDF:', err)
    alert('Fehler beim Herunterladen des PDFs')
  } finally {
    downloading.value = false
  }
}

function createAnother() {
  createdInvoice.value = null
  formData.value = {
    company_id: null,
    period_start: '',
    period_end: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_hours: 0,
    regular_hours: 0,
    takeover_hours: 0,
    holiday_hours: 0,
    count_pkw: 0,
    count_lkw: 0,
    count_oilspill: 0,
    notes: ''
  }
  selectedCompany.value = null
}

onMounted(() => {
  fetchCompanies()
})
</script>

<style scoped>
* {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.page-container {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #0a0a0a 100%);
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #ff006e;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.25rem;
}

.page-header p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  margin-bottom: 2rem;
}

.success-container {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 3rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.success-box {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.success-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
}

.success-box h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
}

.invoice-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #d946ef;
  margin-bottom: 2rem;
}

.success-details {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.detail-value {
  color: #ffffff;
  font-weight: 600;
}

.success-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.btn-download {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 8px 24px rgba(217, 70, 239, 0.3);
}

.btn-download:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(217, 70, 239, 0.4);
}

.btn-download:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-download svg {
  width: 24px;
  height: 24px;
}

.form-container {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.form-section {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #ff006e;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.5rem;
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
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
  font-family: inherit;
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

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.billing-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.billing-section.hourly {
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.4);
}

.billing-section.per-job {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.billing-section.flat-rate {
  background: rgba(217, 70, 239, 0.15);
  border: 1px solid rgba(217, 70, 239, 0.4);
}

.billing-icon {
  font-size: 2.5rem;
}

.billing-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.billing-section p {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0.25rem 0 0 0;
}

.hours-display {
  margin-bottom: 1.5rem;
}

.hours-box {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calculating {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.6);
}

.mini-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #d946ef;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.hours-result {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
}

.hours-icon {
  font-size: 3rem;
}

.hours-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.hours-value {
  font-size: 2rem;
  font-weight: 700;
  color: #d946ef;
  margin-bottom: 0.5rem;
}

.hours-info {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.hours-details {
  flex: 1;
}

.hours-breakdown {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.hours-breakdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  padding: 0.25rem 0;
}

.hours-breakdown-item.takeover {
  color: #f97316;
}

.breakdown-label {
  min-width: 150px;
}

.breakdown-value {
  font-weight: 600;
  color: #ffffff;
}

.hours-breakdown-item.takeover .breakdown-value {
  color: #f97316;
}

.breakdown-rate {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.1);
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.hours-placeholder {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}

.hours-placeholder svg {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
}

.jobs-grid {
  display: grid;
  gap: 1rem;
}

.job-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
}

.job-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.job-icon {
  font-size: 1.5rem;
}

.job-header strong {
  display: block;
  font-size: 0.875rem;
  color: #ffffff;
}

.job-price {
  display: block;
  font-size: 0.75rem;
  color: #10b981;
  font-weight: 600;
}

.job-item input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 0.875rem;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.job-item input:focus {
  outline: none;
  border-color: #ff006e;
  box-shadow: 0 0 0 3px rgba(255, 0, 110, 0.15);
}

.summary-box {
  background: rgba(217, 70, 239, 0.1);
  border: 1px solid rgba(217, 70, 239, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.summary-row strong {
  color: #ffffff;
}

.summary-row.total {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 0.5rem;
  padding-top: 1rem;
  font-size: 1.125rem;
  color: #ffffff;
}

.summary-row.total strong {
  color: #d946ef;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
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
</style>
