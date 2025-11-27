<template>
  <MainLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>📊 Stundenreport</h1>
          <p>Automatisch generierter Report für individuellen Zeitraum</p>
        </div>
      </div>

      <!-- Report Generator -->
      <div class="report-generator">
        <div class="generator-card">
          <h2>Stundenreport generieren</h2>
          <p class="description">
            Wählen Sie eine Firma und einen beliebigen Zeitraum aus. Der Report wird automatisch basierend auf den
            hinterlegten Übernahmezeiten berechnet und berücksichtigt gesetzliche Feiertage.
          </p>

          <div class="form-section">
            <div class="form-group full-width">
              <label>Firma *</label>
              <select v-model="selectedCompanyId" required>
                <option :value="null">Bitte wählen...</option>
                <option v-for="company in companies" :key="company.id" :value="company.id">
                  {{ company.name }} {{ company.city ? `(${company.city})` : '' }}
                </option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Von (Startdatum) *</label>
                <input v-model="startDate" type="date" required @change="validateDates" />
              </div>

              <div class="form-group">
                <label>Bis (Enddatum) *</label>
                <input v-model="endDate" type="date" required @change="validateDates" />
              </div>
            </div>

            <div v-if="dateRangeInfo" class="info-box date-range">
              <div class="info-icon">📅</div>
              <div class="info-content">
                <strong>{{ dateRangeInfo.days }} Tage im ausgewählten Zeitraum</strong>
                <p>{{ dateRangeInfo.description }}</p>
              </div>
            </div>

            <button
              @click="generateReport"
              :disabled="!canGenerate || generating"
              class="btn-generate"
            >
              <svg v-if="!generating" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" class="spinning">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2"/>
              </svg>
              {{ generating ? 'Generiere PDF...' : 'PDF herunterladen' }}
            </button>

            <div v-if="validationError" class="error-message">
              {{ validationError }}
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Select -->
      <div class="quick-select">
        <h3>Schnellauswahl</h3>
        <div class="quick-buttons">
          <button @click="selectThisWeek" class="quick-btn">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2"/>
            </svg>
            Diese Woche
          </button>
          <button @click="selectThisMonth" class="quick-btn">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2"/>
            </svg>
            Dieser Monat
          </button>
          <button @click="selectLastMonth" class="quick-btn">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2"/>
            </svg>
            Letzter Monat
          </button>
          <button @click="selectLast30Days" class="quick-btn">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2"/>
            </svg>
            Letzte 30 Tage
          </button>
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
  city: string | null
  federal_state: string | null
}

const companies = ref<Company[]>([])
const selectedCompanyId = ref<number | null>(null)
const startDate = ref('')
const endDate = ref('')
const generating = ref(false)
const validationError = ref('')

const selectedCompany = computed(() => {
  return companies.value.find(c => c.id === selectedCompanyId.value)
})

const dateRangeInfo = computed(() => {
  if (!startDate.value || !endDate.value) return null

  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

  const startFormatted = start.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
  const endFormatted = end.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })

  return {
    days: diffDays,
    description: `${startFormatted} bis ${endFormatted}`
  }
})

const canGenerate = computed(() => {
  return selectedCompanyId.value && startDate.value && endDate.value && !validationError.value
})

function validateDates() {
  validationError.value = ''

  if (!startDate.value || !endDate.value) return

  const start = new Date(startDate.value)
  const end = new Date(endDate.value)

  if (start > end) {
    validationError.value = 'Das Startdatum muss vor dem Enddatum liegen'
  }

  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays > 365) {
    validationError.value = 'Der Zeitraum darf maximal 365 Tage betragen'
  }
}

function selectThisWeek() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  startDate.value = monday.toISOString().split('T')[0] ?? ''
  endDate.value = sunday.toISOString().split('T')[0] ?? ''
  validateDates()
}

function selectThisMonth() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  startDate.value = firstDay.toISOString().split('T')[0] ?? ''
  endDate.value = lastDay.toISOString().split('T')[0] ?? ''
  validateDates()
}

function selectLastMonth() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)

  startDate.value = firstDay.toISOString().split('T')[0] ?? ''
  endDate.value = lastDay.toISOString().split('T')[0] ?? ''
  validateDates()
}

function selectLast30Days() {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 29)

  startDate.value = start.toISOString().split('T')[0] ?? ''
  endDate.value = end.toISOString().split('T')[0] ?? ''
  validateDates()
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

async function generateReport() {
  if (!canGenerate.value) {
    alert('Bitte füllen Sie alle Felder aus')
    return
  }

  generating.value = true

  try {
    const token = localStorage.getItem('token')
    const response = await axios.post(
      'http://188.245.198.220:3000/api/reports/stundenreport',
      {
        company_id: selectedCompanyId.value,
        start_date: startDate.value,
        end_date: endDate.value
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      }
    )

    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    const companyName = selectedCompany.value?.name.replace(/\s+/g, '_')
    const periodStr = `${startDate.value}_bis_${endDate.value}`

    link.setAttribute('download', `Stundenreport_${companyName}_${periodStr}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

  } catch (err: any) {
    console.error('Error generating report:', err)
    alert('Fehler beim Generieren des Reports: ' + (err.response?.data?.error || err.message))
  } finally {
    generating.value = false
  }
}

onMounted(() => {
  fetchCompanies()
  selectThisMonth()
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
  color: #ff006e;
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

.report-generator {
  margin-bottom: 2rem;
}

.generator-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.generator-card h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ff006e;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.75rem;
}

.description {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.form-section {
  margin-top: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 0;
}

.full-width {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
}

.form-group select,
.form-group input[type="date"] {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 0.875rem;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
}

.form-group select:focus,
.form-group input[type="date"]:focus {
  outline: none;
  border-color: #ff006e;
  box-shadow: 0 0 0 3px rgba(255, 0, 110, 0.15);
  background: rgba(255, 255, 255, 0.08);
}

.form-group select option {
  background: #1e293b;
  color: #ffffff;
}

.info-box {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.info-box.date-range {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
}

.info-box.date-range .info-content {
  color: #10b981;
}

.info-box.date-range .info-content strong {
  color: #10b981;
}

.info-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.info-content strong {
  display: block;
  color: #8b5cf6;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.info-content p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  margin: 0.25rem 0;
}

.btn-generate {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 8px 24px rgba(217, 70, 239, 0.3);
}

.btn-generate:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(217, 70, 239, 0.4);
}

.btn-generate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-generate svg {
  width: 24px;
  height: 24px;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  margin-top: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  border-radius: 10px;
  font-size: 0.875rem;
}

.quick-select {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.quick-select h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 1rem;
}

.quick-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.quick-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn:hover {
  background: linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%);
  border-color: transparent;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(217, 70, 239, 0.3);
}

.quick-btn svg {
  width: 20px;
  height: 20px;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .quick-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
