<template>
  <MainLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Firmenverwaltung</h1>
          <p>Verwalten Sie Ihre Kunden und deren Bereitschaftszeiten</p>
        </div>
        <button @click="openCreateModal" class="btn-primary">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Neue Firma
        </button>
      </div>

      <!-- SUCHFILTER -->
      <div class="filter-section">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Firma oder Kundennummer suchen..." 
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        
        <div class="filter-info">
          <span>{{ filteredCompanies.length }} von {{ companies.length }} Firmen</span>
        </div>
      </div>

      <!-- FIRMEN LISTE -->
      <div class="companies-list">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          Lade Firmen...
        </div>
        <div v-else-if="filteredCompanies.length === 0" class="empty">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2"/>
          </svg>
          <p v-if="searchQuery">Keine Firmen gefunden für "{{ searchQuery }}"</p>
          <p v-else>Keine Firmen vorhanden</p>
        </div>
        
        <div v-else class="table-container">
          <table class="companies-table">
            <thead>
              <tr>
                <th @click="sortBy('customer_number')" class="sortable">
                  Kundennummer
                  <svg v-if="sortKey === 'customer_number'" viewBox="0 0 24 24" fill="none" :class="{ reversed: sortDirection === 'desc' }">
                    <path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </th>
                <th @click="sortBy('name')" class="sortable">
                  Firmenname
                  <svg v-if="sortKey === 'name'" viewBox="0 0 24 24" fill="none" :class="{ reversed: sortDirection === 'desc' }">
                    <path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </th>
                <th>Kontakt</th>
                <th>Stadt</th>
                <th>Abrechnungsmodell</th>
                <th>Preise</th>
                <th class="actions-col">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="company in sortedCompanies" :key="company.id" class="company-row">
                <td>
                  <span v-if="company.customer_number" class="customer-number">{{ company.customer_number }}</span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td class="company-name">
                  <div class="name-cell">
                    <div class="company-avatar">{{ company.name.charAt(0).toUpperCase() }}</div>
                    <div>
                      <strong>{{ company.name }}</strong>
                      <span v-if="company.postal_code" class="postal-code">{{ company.postal_code }}</span>
                    </div>
                  </div>
                </td>
                <td class="contact-cell">
                  <div v-if="company.contact_person || company.phone">
                    <div v-if="company.contact_person" class="contact-name">{{ company.contact_person }}</div>
                    <div v-if="company.phone" class="contact-phone">📞 {{ company.phone }}</div>
                  </div>
                  <span v-else class="text-muted">—</span>
                </td>
                <td>
                  <span v-if="company.city">{{ company.city }}</span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td>
                  <span v-if="company.billing_type === 'hourly'" class="badge badge-blue">
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                      <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Stundenpreis
                  </span>
                  <span v-else-if="company.billing_type === 'per_job'" class="badge badge-green">
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                      <path d="M9 11l3 3L22 4" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Pro Auftrag
                  </span>
                  <span v-else-if="company.billing_type === 'flat_rate'" class="badge badge-purple">
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Monatspauschale
                  </span>
                  <span v-else class="badge badge-gray">Nicht hinterlegt</span>
                </td>
                <td class="prices-cell">
                  <div v-if="company.billing_type === 'hourly'" class="price-info">
                    <strong>{{ company.hourly_rate?.toFixed(2) }} €</strong> / Stunde
                  </div>
                  <div v-else-if="company.billing_type === 'per_job'" class="price-list">
                    <div v-if="company.price_pkw" class="price-item">🚗 {{ company.price_pkw.toFixed(2) }} €</div>
                    <div v-if="company.price_lkw" class="price-item">🚛 {{ company.price_lkw.toFixed(2) }} €</div>
                    <div v-if="company.price_oilspill" class="price-item">🛢️ {{ company.price_oilspill.toFixed(2) }} €</div>
                  </div>
                  <div v-else-if="company.billing_type === 'flat_rate'" class="price-info">
                    <strong>{{ company.monthly_rate?.toFixed(2) }} €</strong> / Monat
                  </div>
                  <span v-else class="text-muted">—</span>
                </td>
                <td class="actions-cell">
                  <button @click="editCompany(company)" class="btn-icon" title="Bearbeiten">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </button>
                  <button @click="deleteCompany(company)" class="btn-icon btn-danger" title="Löschen">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal -->
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h2>{{ editMode ? 'Firma bearbeiten' : 'Neue Firma' }}</h2>
            <button @click="closeModal" class="close-btn">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveCompany" class="modal-form">
            <!-- Basis-Infos -->
            <div class="form-section">
              <h3>Basisinformationen</h3>
              
              <div class="form-group">
                <label>Kundennummer</label>
                <input v-model="formData.customer_number" type="text" placeholder="z.B. KD-2025-001" />
                <small>Optional - Eindeutige Identifikationsnummer für den Kunden</small>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Firmenname *</label>
                  <input v-model="formData.name" type="text" required />
                </div>
                <div class="form-group">
                  <label>Ansprechpartner</label>
                  <input v-model="formData.contact_person" type="text" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>E-Mail</label>
                  <input v-model="formData.email" type="email" />
                </div>
                <div class="form-group">
                  <label>Telefon</label>
                  <input v-model="formData.phone" type="tel" />
                </div>
              </div>

              <div class="form-group">
                <label>Adresse</label>
                <input v-model="formData.address" type="text" />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>PLZ</label>
                  <input v-model="formData.postal_code" type="text" />
                </div>
                <div class="form-group">
                  <label>Stadt</label>
                  <input v-model="formData.city" type="text" />
                </div>
              </div>
            </div>

            <!-- Abrechnungsmodell -->
            <div class="form-section">
              <h3>Abrechnungsmodell</h3>
              <div class="form-group">
                <label>Abrechnungsart *</label>
                <select v-model="formData.billing_type" required>
                  <option :value="null">Bitte wählen...</option>
                  <option value="hourly">Stundenpreis</option>
                  <option value="per_job">Preis pro Auftrag</option>
                  <option value="flat_rate">Monatspauschale</option>
                </select>
              </div>

              <div v-if="formData.billing_type === 'hourly'" class="billing-details">
                <div class="form-group">
                  <label>Stundenlohn (€) *</label>
                  <input v-model.number="formData.hourly_rate" type="number" step="0.01" min="0" required />
                </div>
              </div>

              <div v-if="formData.billing_type === 'per_job'" class="billing-details">
                <div class="form-row">
                  <div class="form-group">
                    <label>🚗 PKW-Bergung (€)</label>
                    <input v-model.number="formData.price_pkw" type="number" step="0.01" min="0" />
                  </div>
                  <div class="form-group">
                    <label>🚛 LKW-Bergung (€)</label>
                    <input v-model.number="formData.price_lkw" type="number" step="0.01" min="0" />
                  </div>
                </div>
                <div class="form-group">
                  <label>🛢️ Ölspur-Beseitigung (€)</label>
                  <input v-model.number="formData.price_oilspill" type="number" step="0.01" min="0" />
                </div>
                <div class="form-group">
                  <label>💼 Service Pauschale (Monatlich) (€)</label>
                  <input v-model.number="formData.service_fee" type="number" step="0.01" min="0" />
                </div>
              </div>

              <div v-if="formData.billing_type === 'flat_rate'" class="billing-details">
                <div class="form-group">
                  <label>Monatspauschale (€) *</label>
                  <input v-model.number="formData.monthly_rate" type="number" step="0.01" min="0" required />
                </div>
              </div>

              <div v-if="formData.billing_type" class="form-group" style="margin-top: 1.5rem;">
                <label>Preis pro Stunde (Frühzeitige Übernahme) (€)</label>
                <input v-model.number="formData.early_takeover_price" type="number" step="0.01" min="0" />
                <small>Preis für Stunden bei frühzeitiger Übernahme (außerhalb der Pauschale)</small>
              </div>
            </div>

            <!-- Öffnungszeiten -->
            <div class="form-section">
              <h3>Bereitschaftszeiten</h3>
              <div v-for="day in weekdays" :key="day.key" class="time-row">
                <label class="day-label">{{ day.label }}</label>
                <input v-model="formData[`${day.key}_start`]" type="time" placeholder="Von" />
                <span>bis</span>
                <input v-model="formData[`${day.key}_end`]" type="time" placeholder="Bis" />
              </div>
            </div>

            <!-- Feiertage -->
            <div class="form-section">
              <h3>Feiertags-Einstellungen</h3>
              
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="formData.holiday_takeover" type="checkbox" />
                  <span>An Feiertagen übernehmen?</span>
                </label>
                <small>Wenn aktiviert, werden Feiertage mit den angegebenen Zeiten berechnet</small>
              </div>

              <div v-if="formData.holiday_takeover" class="form-group">
                <label>Zeiten übernehmen von:</label>
                <select v-model="formData.holiday_schedule_ref">
                  <option value="monday">Montag</option>
                  <option value="tuesday">Dienstag</option>
                  <option value="wednesday">Mittwoch</option>
                  <option value="thursday">Donnerstag</option>
                  <option value="friday">Freitag</option>
                  <option value="saturday">Samstag</option>
                  <option value="sunday">Sonntag</option>
                </select>
                <small>Wählen Sie, welche Wochentag-Zeiten für Feiertage verwendet werden sollen</small>
              </div>
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
  customer_number?: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postal_code?: string
  billing_type?: string
  hourly_rate?: number
  price_pkw?: number
  price_lkw?: number
  price_oilspill?: number
  early_takeover_price?: number
  holiday_takeover?: boolean
  holiday_schedule_ref?: string
  [key: string]: any
}

const companies = ref<Company[]>([])
const loading = ref(false)
const showModal = ref(false)
const editMode = ref(false)
const saving = ref(false)
const error = ref('')
const searchQuery = ref('')
const sortKey = ref('name')
const sortDirection = ref<'asc' | 'desc'>('asc')

const weekdays = [
  { key: 'monday', label: 'Montag' },
  { key: 'tuesday', label: 'Dienstag' },
  { key: 'wednesday', label: 'Mittwoch' },
  { key: 'thursday', label: 'Donnerstag' },
  { key: 'friday', label: 'Freitag' },
  { key: 'saturday', label: 'Samstag' },
  { key: 'sunday', label: 'Sonntag' }
]

const formData = ref<any>({
  id: null,
  name: '',
  customer_number: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postal_code: '',
  billing_type: null,
  hourly_rate: null,
  price_pkw: null,
  price_lkw: null,
  price_oilspill: null,
  service_fee: null,
  monthly_rate: null,
  early_takeover_price: null,
  monday_start: '',
  monday_end: '',
  tuesday_start: '',
  tuesday_end: '',
  wednesday_start: '',
  wednesday_end: '',
  thursday_start: '',
  thursday_end: '',
  friday_start: '',
  friday_end: '',
  saturday_start: '',
  saturday_end: '',
  sunday_start: '',
  sunday_end: '',
  holiday_takeover: true,
  holiday_schedule_ref: 'sunday'
})

const filteredCompanies = computed(() => {
  if (!searchQuery.value) return companies.value
  
  const query = searchQuery.value.toLowerCase()
  return companies.value.filter(company => 
    company.name.toLowerCase().includes(query) ||
    company.city?.toLowerCase().includes(query) ||
    company.customer_number?.toLowerCase().includes(query) ||
    company.contact_person?.toLowerCase().includes(query)
  )
})

const sortedCompanies = computed(() => {
  const sorted = [...filteredCompanies.value]
  
  sorted.sort((a, b) => {
    let aVal = a[sortKey.value]
    let bVal = b[sortKey.value]
    
    if (!aVal) return 1
    if (!bVal) return -1
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (sortDirection.value === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })
  
  return sorted
})

function sortBy(key: string) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDirection.value = 'asc'
  }
}

async function fetchCompanies() {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('http://188.245.198.220:3000/api/companies', {
      headers: { Authorization: `Bearer ${token}` }
    })
    companies.value = response.data
  } catch (err) {
    console.error('Error fetching companies:', err)
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editMode.value = false
  formData.value = {
    id: null,
    name: '',
    customer_number: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    billing_type: null,
    hourly_rate: null,
    price_pkw: null,
    price_lkw: null,
    price_oilspill: null,
    service_fee: null,
    monthly_rate: null,
    early_takeover_price: null,
    monday_start: '',
    monday_end: '',
    tuesday_start: '',
    tuesday_end: '',
    wednesday_start: '',
    wednesday_end: '',
    thursday_start: '',
    thursday_end: '',
    friday_start: '',
    friday_end: '',
    saturday_start: '',
    saturday_end: '',
    sunday_start: '',
    sunday_end: '',
    holiday_takeover: true,
    holiday_schedule_ref: 'sunday'
  }
  error.value = ''
  showModal.value = true
}

function editCompany(company: Company) {
  editMode.value = true
  formData.value = { ...company }
  error.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function saveCompany() {
  saving.value = true
  error.value = ''

  try {
    const token = localStorage.getItem('token')
    
    if (editMode.value) {
      await axios.put(
        `http://188.245.198.220:3000/api/companies/${formData.value.id}`,
        formData.value,
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } else {
      await axios.post(
        'http://188.245.198.220:3000/api/companies',
        formData.value,
        { headers: { Authorization: `Bearer ${token}` } }
      )
    }
    
    await fetchCompanies()
    closeModal()
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Fehler beim Speichern'
  } finally {
    saving.value = false
  }
}

async function deleteCompany(company: Company) {
  if (!confirm(`Möchten Sie die Firma "${company.name}" wirklich löschen?`)) return

  try {
    const token = localStorage.getItem('token')
    await axios.delete(
      `http://188.245.198.220:3000/api/companies/${company.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    await fetchCompanies()
  } catch (err: any) {
    alert(err.response?.data?.error || 'Fehler beim Löschen')
  }
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
  max-width: 1600px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #0a0a0a 100%);
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
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 8px 24px rgba(217, 70, 239, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(217, 70, 239, 0.4);
}

.btn-primary svg {
  width: 18px;
  height: 18px;
}

.filter-section {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.search-box {
  flex: 1;
  max-width: 500px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-box svg {
  position: absolute;
  left: 1rem;
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.5);
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.search-box input:focus {
  outline: none;
  border-color: #ff006e;
  box-shadow: 0 0 0 3px rgba(255, 0, 110, 0.15);
  background: rgba(255, 255, 255, 0.08);
}

.clear-btn {
  position: absolute;
  right: 0.5rem;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.clear-btn svg {
  position: static;
  width: 14px;
  height: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.filter-info {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.companies-list {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.loading, .empty {
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.5);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #d946ef;
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
  color: rgba(255, 255, 255, 0.3);
}

.table-container {
  overflow-x: auto;
}

.companies-table {
  width: 100%;
  border-collapse: collapse;
}

.companies-table thead {
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.companies-table th {
  text-align: left;
  padding: 1rem 1.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.companies-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
}

.companies-table th.sortable:hover {
  color: #d946ef;
}

.companies-table th svg {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-left: 0.25rem;
  vertical-align: middle;
  transition: transform 0.2s;
}

.companies-table th svg.reversed {
  transform: rotate(180deg);
}

.companies-table tbody tr {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s;
}

.companies-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.05);
}

.companies-table td {
  padding: 1.25rem 1.5rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

.customer-number {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #d946ef;
  background: rgba(217, 70, 239, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  border: 1px solid rgba(217, 70, 239, 0.3);
}

.company-name {
  font-weight: 600;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.company-avatar {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.125rem;
  flex-shrink: 0;
}

.postal-code {
  display: block;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 400;
  margin-top: 0.125rem;
}

.contact-cell {
  line-height: 1.5;
}

.contact-name {
  font-weight: 500;
  color: #ffffff;
}

.contact-phone {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.125rem;
}

.text-muted {
  color: rgba(255, 255, 255, 0.4);
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge svg {
  width: 14px;
  height: 14px;
}

.badge-blue {
  background: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.badge-green {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.badge-gray {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.badge-purple {
  background: rgba(217, 70, 239, 0.2);
  color: #d946ef;
  border: 1px solid rgba(217, 70, 239, 0.3);
}

.prices-cell {
  min-width: 150px;
}

.price-info {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

.price-info strong {
  color: #d946ef;
  font-size: 1rem;
}

.price-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.price-item {
  font-size: 0.75rem;
  color: #10b981;
  font-weight: 500;
}

.actions-col {
  width: 120px;
  text-align: right;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #d946ef;
}

.btn-icon.btn-danger:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
}

.btn-icon svg {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.6);
}

.btn-icon.btn-danger svg {
  color: #ef4444;
}

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

.modal {
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 0, 110, 0.2);
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(20px);
  z-index: 10;
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

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.close-btn svg {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.6);
}

.modal-form {
  padding: 2rem;
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h3 {
  font-size: 1.125rem;
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
.form-group select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #ff006e;
  box-shadow: 0 0 0 3px rgba(255, 0, 110, 0.15);
  background: rgba(255, 255, 255, 0.08);
}

.form-group select option {
  background: #1e293b;
  color: #ffffff;
}

.form-group small {
  display: block;
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.billing-details {
  margin-top: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.time-row {
  display: grid;
  grid-template-columns: 120px 1fr auto 1fr;
  gap: 1rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

.day-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.time-row input {
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 0.875rem;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.time-row input:focus {
  outline: none;
  border-color: #ff006e;
  box-shadow: 0 0 0 3px rgba(255, 0, 110, 0.15);
}

.time-row span {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  accent-color: #d946ef;
}

.checkbox-label span {
  color: rgba(255, 255, 255, 0.9);
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
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
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  bottom: 0;
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(20px);
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}
</style>
