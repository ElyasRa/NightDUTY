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
        <h3 class="stat-value">0</h3>
        <span class="stat-trend down">↓ +12% seit letztem Monat</span>
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
        <h3 class="stat-value">0,00 €</h3>
        <span class="stat-info">0 unbezahlt</span>
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
        <h3 class="stat-value">0</h3>
        <span class="stat-trend up">↑ +3 diesen Monat</span>
      </div>

      <div class="stat-card">
        <div class="stat-icon pink">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M7 17L17 7M17 7H10M17 7v7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="stat-mini-icon">📊</div>
        <p class="stat-label">Monatsumsatz</p>
        <h3 class="stat-value">0,00 €</h3>
        <span class="stat-trend down-red">↓ -18% vs. letzter Monat</span>
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
            <span class="quick-badge">0</span>
          </router-link>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card">
        <h2 class="card-title">Letzte Aktivitäten</h2>
        <div class="activity-list">
          <div class="activity-item">
            <div class="activity-icon blue">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <div class="activity-content">
              <p class="activity-title">Rechnung RE-2025-001 erstellt</p>
              <span class="activity-time">Vor 2 Stunden</span>
            </div>
          </div>

          <div class="activity-item">
            <div class="activity-icon green">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="activity-content">
              <p class="activity-title">Zahlung für Mustermann GmbH gebucht</p>
              <span class="activity-time">Vor 4 Stunden</span>
            </div>
          </div>

          <div class="activity-item">
            <div class="activity-icon purple">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M3 21h18M5 21V7l8-4v18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="activity-content">
              <p class="activity-title">Neue Firma hinzugefügt: Schmidt AG</p>
              <span class="activity-time">Gestern</span>
            </div>
          </div>

          <div class="activity-item">
            <div class="activity-icon orange">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <div class="activity-content">
              <p class="activity-title">Stundenreport November generiert</p>
              <span class="activity-time">Vor 2 Tagen</span>
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
import MainLayout from '../layouts/MainLayout.vue'
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
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  position: relative;
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transform: translateY(-2px);
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
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
}

.stat-icon.green {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.stat-icon.pink {
  background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
}

.stat-mini-icon {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  font-size: 1.5rem;
  opacity: 0.3;
}

.stat-label {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  color: #111827;
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-trend, .stat-info {
  font-size: 0.75rem;
}

.stat-trend.up {
  color: #10b981;
}

.stat-trend.down {
  color: #ef4444;
}

.stat-trend.down-red {
  color: #ef4444;
}

.stat-info {
  color: #9ca3af;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  padding: 0 2rem 2rem 2rem;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
}

.chart-card {
  grid-column: 1 / -1;
}

.card-title {
  color: #111827;
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
  border: none;
  border-radius: 10px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  text-align: left;
  text-decoration: none;
}

.quick-btn.blue-bg {
  background: rgba(59, 130, 246, 0.08);
}

.quick-btn.green-bg {
  background: rgba(16, 185, 129, 0.08);
}

.quick-btn.purple-bg {
  background: rgba(139, 92, 246, 0.08);
}

.quick-btn.orange-bg {
  background: rgba(245, 158, 11, 0.08);
}

.quick-btn:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transform: translateX(2px);
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
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
}

.quick-icon.green {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.quick-icon.purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
}

.quick-icon.orange {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
}

.quick-badge {
  margin-left: auto;
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
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
  background: #f9fafb;
  border-radius: 8px;
  transition: all 0.2s;
}

.activity-item:hover {
  background: #f3f4f6;
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
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
}

.activity-icon.green {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.activity-icon.purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
}

.activity-icon.orange {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
}

.activity-content {
  flex: 1;
}

.activity-title {
  color: #111827;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.activity-time {
  color: #9ca3af;
  font-size: 0.75rem;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: #f9fafb;
  border-radius: 8px;
}

.chart-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.chart-placeholder p {
  color: #9ca3af;
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
