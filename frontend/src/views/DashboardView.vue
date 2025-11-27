<template>
  <MainLayout>
    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="stat-mini-icon">📄</div>
        <p class="stat-label">Offene Rechnungen</p>
        <h3 class="stat-value">{{ loading ? '...' : offeneRechnungenCount }}</h3>
        <span class="stat-info">{{ loading ? '' : offeneRechnungenCount === 1 ? '1 offene Rechnung' : `${offeneRechnungenCount} offene Rechnungen` }}</span>
      </div>

      <div class="stat-card">
        <div class="stat-icon orange">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9"/>
            <text x="12" y="16" text-anchor="middle" font-size="10" font-weight="bold" fill="currentColor" stroke="none">$</text>
          </svg>
        </div>
        <div class="stat-mini-icon">💰</div>
        <p class="stat-label">Offener Umsatz</p>
        <h3 class="stat-value">{{ loading ? '...' : formatCurrency(offenerUmsatz) }}</h3>
        <span class="stat-info">{{ loading ? '' : `${offeneRechnungenCount} unbezahlt` }}</span>
      </div>

      <div class="stat-card">
        <div class="stat-icon green">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="stat-mini-icon">🏢</div>
        <p class="stat-label">Aktive Firmen</p>
        <h3 class="stat-value">{{ loading ? '...' : aktiveFirmen }}</h3>
        <span class="stat-info">{{ loading ? '' : `${aktiveFirmen} aktive Firmen` }}</span>
      </div>

      <div class="stat-card">
        <div class="stat-icon pink">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M7 17L17 7M17 7H10M17 7v7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="stat-mini-icon">📊</div>
        <p class="stat-label">Monatsumsatz</p>
        <h3 class="stat-value">{{ loading ? '...' : formatCurrency(monatsumsatz) }}</h3>
        <span class="stat-info">{{ loading ? '' : 'Laufender Monat' }}</span>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="content-grid">
      <!-- Quick Actions -->
      <div class="card">
        <h2 class="card-title">Schnellzugriff</h2>
        <div class="quick-actions">
          <router-link to="/rechnung-erstellen" class="quick-btn blue-bg">
            <div class="quick-icon blue">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <span>Neue Rechnung erstellen</span>
          </router-link>

          <router-link to="/stundenreport" class="quick-btn green-bg">
            <div class="quick-icon green">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <span>Stundenreport generieren</span>
          </router-link>

          <router-link to="/firmenverwaltung" class="quick-btn purple-bg">
            <div class="quick-icon purple">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <span>Firmenverwaltung</span>
          </router-link>

          <router-link to="/offene-rechnungen" class="quick-btn orange-bg">
            <div class="quick-icon orange">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <span>Offene Rechnungen</span>
            <span v-if="!loading && offeneRechnungenCount > 0" class="quick-badge">{{ offeneRechnungenCount }}</span>
          </router-link>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card">
        <h2 class="card-title">Letzte Aktivitäten</h2>
        <div v-if="loading" class="activity-loading">
          <div class="spinner-small"></div>
          <p>Lade Aktivitäten...</p>
        </div>
        <div v-else-if="recentActivities.length === 0" class="activity-empty">
          <p>Keine Aktivitäten vorhanden</p>
        </div>
        <div v-else class="activity-list">
          <div v-for="(activity, index) in recentActivities" :key="index" class="activity-item">
            <div class="activity-icon" :class="activity.color">
              <svg v-if="activity.type === 'invoice'" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
              </svg>
              <svg v-else-if="activity.type === 'payment'" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none">
                <path d="M3 21h18M5 21V7l8-4v18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="activity-content">
              <p class="activity-title">{{ activity.title }}</p>
              <span class="activity-time">{{ formatTimeAgo(activity.date) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart Placeholder -->
      <div class="card chart-card">
        <h2 class="card-title">Umsatzentwicklung</h2>
        <div class="chart-placeholder">
          <div class="chart-icon">📊</div>
          <p>Chart wird noch implementiert</p>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import MainLayout from '../layouts/MainLayout.vue'

interface Company {
  id: number
  name: string
  is_active: boolean
  created_at: string
}

interface Payment {
  id: number
  amount: number
  payment_date: string
  created_at: string
}

interface Invoice {
  id: number
  invoice_number: string
  company: {
    id: number
    name: string
  }
  invoice_date: string
  due_date: string
  total_amount: number
  status: string
  payments: Payment[]
  created_at: string
}

interface Activity {
  type: 'invoice' | 'payment' | 'company'
  title: string
  date: Date
  icon: string
  color: string
}

const API_URL = 'http://188.245.198.220:3000'

const invoices = ref<Invoice[]>([])
const companies = ref<Company[]>([])
const loading = ref(true)

// Computed statistics
const offeneRechnungenCount = computed(() => {
  return invoices.value.filter(inv => inv.status === 'open' || inv.status === 'partial').length
})

const offenerUmsatz = computed(() => {
  return invoices.value
    .filter(inv => inv.status === 'open' || inv.status === 'partial')
    .reduce((sum, inv) => {
      const totalPaid = inv.payments.reduce((pSum, p) => pSum + p.amount, 0)
      return sum + (inv.total_amount - totalPaid)
    }, 0)
})

const aktiveFirmen = computed(() => {
  return companies.value.filter(c => c.is_active).length
})

const monatsumsatz = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  let total = 0
  invoices.value.forEach(invoice => {
    invoice.payments.forEach(payment => {
      const paymentDate = new Date(payment.payment_date)
      if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
        total += payment.amount
      }
    })
  })
  return total
})

const recentActivities = computed(() => {
  const activities: Activity[] = []
  
  // Add latest invoices (up to 3)
  const latestInvoices = [...invoices.value]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)
  
  latestInvoices.forEach(inv => {
    activities.push({
      type: 'invoice',
      title: `Rechnung ${inv.invoice_number} erstellt`,
      date: new Date(inv.created_at),
      icon: 'blue',
      color: 'blue'
    })
  })
  
  // Add latest payments (up to 3)
  const allPayments: { payment: Payment; companyName: string; date: Date }[] = []
  invoices.value.forEach(inv => {
    inv.payments.forEach(payment => {
      // Use created_at if available and valid, otherwise fall back to payment_date
      const dateStr = (payment.created_at && payment.created_at.trim()) 
        ? payment.created_at 
        : payment.payment_date
      allPayments.push({
        payment,
        companyName: inv.company.name,
        date: new Date(dateStr)
      })
    })
  })
  
  const latestPayments = allPayments
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 3)
  
  latestPayments.forEach(({ payment, companyName, date }) => {
    activities.push({
      type: 'payment',
      title: `Zahlung für ${companyName} gebucht`,
      date,
      icon: 'green',
      color: 'green'
    })
  })
  
  // Add latest companies (up to 2)
  const latestCompanies = [...companies.value]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 2)
  
  latestCompanies.forEach(company => {
    activities.push({
      type: 'company',
      title: `Neue Firma hinzugefügt: ${company.name}`,
      date: new Date(company.created_at),
      icon: 'purple',
      color: 'purple'
    })
  })
  
  // Sort all activities by date and return top 5
  return activities
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5)
})

const fetchData = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }
    
    // Fetch invoices and companies in parallel
    const [invoicesRes, companiesRes] = await Promise.all([
      axios.get(`${API_URL}/api/invoices`, { params: { status: 'all' }, headers }),
      axios.get(`${API_URL}/api/companies`, { headers })
    ])
    
    invoices.value = invoicesRes.data
    companies.value = companiesRes.data
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  } finally {
    loading.value = false
  }
}

const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

const formatTimeAgo = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Gerade eben'
  if (diffMins < 60) return `Vor ${diffMins} ${diffMins === 1 ? 'Minute' : 'Minuten'}`
  if (diffHours < 24) return `Vor ${diffHours} ${diffHours === 1 ? 'Stunde' : 'Stunden'}`
  if (diffDays === 1) return 'Gestern'
  if (diffDays < 7) return `Vor ${diffDays} Tagen`
  return date.toLocaleDateString('de-DE')
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  padding: 2rem;
}

.stat-card {
  background: rgba(20, 20, 20, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 0, 110, 0.2);
  border-radius: 12px;
  padding: 1.25rem;
  position: relative;
  transition: all 0.3s;
  box-shadow: 0 8px 32px 0 rgba(255, 0, 110, 0.1);
}

.stat-card:hover {
  box-shadow: 0 8px 32px rgba(255, 0, 110, 0.2);
  transform: translateY(-2px);
  border-color: rgba(255, 0, 110, 0.4);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.stat-icon.blue {
  background: linear-gradient(135deg, #8338ec 0%, #3b82f6 100%);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #ff006e 0%, #f59e0b 100%);
}

.stat-icon.green {
  background: linear-gradient(135deg, #10b981 0%, #8338ec 100%);
}

.stat-icon.pink {
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
}

.stat-mini-icon {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  font-size: 1.5rem;
  opacity: 0.3;
}

.stat-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  color: white;
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-trend, .stat-info {
  font-size: 0.75rem;
}

.stat-trend.up {
  color: #34d399;
}

.stat-trend.down {
  color: #ff6b6b;
}

.stat-trend.down-red {
  color: #ff6b6b;
}

.stat-info {
  color: rgba(255, 255, 255, 0.4);
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  padding: 0 2rem 2rem 2rem;
}

.card {
  background: rgba(20, 20, 20, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 0, 110, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px 0 rgba(255, 0, 110, 0.1);
}

.chart-card {
  grid-column: 1 / -1;
}

.card-title {
  color: white;
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quick-btn {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  text-align: left;
  text-decoration: none;
}

.quick-btn.blue-bg {
  background: rgba(255, 0, 110, 0.08);
}

.quick-btn.green-bg {
  background: rgba(131, 56, 236, 0.08);
}

.quick-btn.purple-bg {
  background: rgba(131, 56, 236, 0.08);
}

.quick-btn.orange-bg {
  background: rgba(255, 0, 110, 0.08);
}

.quick-btn:hover {
  box-shadow: 0 4px 16px rgba(255, 0, 110, 0.2);
  transform: translateX(2px);
  border-color: rgba(255, 0, 110, 0.3);
}

.quick-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quick-icon svg {
  width: 18px;
  height: 18px;
  color: white;
}

.quick-icon.blue {
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
}

.quick-icon.green {
  background: linear-gradient(135deg, #10b981 0%, #8338ec 100%);
}

.quick-icon.purple {
  background: linear-gradient(135deg, #8338ec 0%, #a855f7 100%);
}

.quick-icon.orange {
  background: linear-gradient(135deg, #ff006e 0%, #f59e0b 100%);
}

.quick-badge {
  margin-left: auto;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
}

.activity-loading, .activity-empty {
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.4);
}

.spinner-small {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(255, 0, 110, 0.2);
  border-top-color: #ff006e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.activity-item {
  display: flex;
  gap: 0.875rem;
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.2s;
}

.activity-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 0, 110, 0.2);
}

.activity-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-icon svg {
  width: 18px;
  height: 18px;
  color: white;
}

.activity-icon.blue {
  background: linear-gradient(135deg, #8338ec 0%, #3b82f6 100%);
}

.activity-icon.green {
  background: linear-gradient(135deg, #10b981 0%, #8338ec 100%);
}

.activity-icon.purple {
  background: linear-gradient(135deg, #8338ec 0%, #a855f7 100%);
}

.activity-icon.orange {
  background: linear-gradient(135deg, #ff006e 0%, #f59e0b 100%);
}

.activity-content {
  flex: 1;
}

.activity-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.activity-time {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.chart-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.chart-placeholder p {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.875rem;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
