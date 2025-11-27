<template>
  <div class="layout">
    <!-- TOP HEADER -->
    <header class="top-header">
      <div class="header-left">
        <h1 class="brand">NightDUTY</h1>
        <span class="subtitle">Buchhaltungssystem</span>
      </div>
      <div class="header-right">
        <button class="notification-btn">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span class="badge">3</span>
        </button>
        <div class="user-menu">
          <div>
            <div class="user-name">Admin</div>
            <div class="user-role">Administrator</div>
          </div>
          <div class="user-avatar">AD</div>
        </div>
      </div>
    </header>

    <div class="content-wrapper">
      <!-- LEFT SIDEBAR -->
      <nav class="sidebar" :class="{ collapsed: sidebarCollapsed }">
        <button class="toggle-btn" @click="toggleSidebar">
          <svg viewBox="0 0 24 24" fill="none" :style="{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>

        <div class="sidebar-inner">
          <div class="nav-links">
          <!-- Dashboard -->
          <router-link to="/dashboard" class="nav-item">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" stroke="currentColor" stroke-width="2"/>
                <rect x="14" y="3" width="7" height="7" stroke="currentColor" stroke-width="2"/>
                <rect x="14" y="14" width="7" height="7" stroke="currentColor" stroke-width="2"/>
                <rect x="3" y="14" width="7" height="7" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <span class="nav-text">Dashboard</span>
          </router-link>

          <!-- Stundenreport -->
          <router-link to="/stundenreport" class="nav-item">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <span class="nav-text">Stundenreport</span>
          </router-link>

          <!-- Rechnung erstellen -->
          <router-link to="/rechnung-erstellen" class="nav-item">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <span class="nav-text">Rechnung erstellen</span>
          </router-link>

          <!-- Rechnungsversand -->
          <router-link to="/rechnungsversand" class="nav-item">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="nav-text">Rechnungsversand</span>
          </router-link>

          <!-- Offene Rechnungen -->
          <router-link to="/offene-rechnungen" class="nav-item">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <span class="nav-text">Offene Rechnungen</span>
          </router-link>

          <!-- Alle Rechnungen -->
          <router-link to="/alle-rechnungen" class="nav-item">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <span class="nav-text">Alle Rechnungen</span>
          </router-link>

          <!-- Zahlung buchen -->
          <router-link to="/zahlung-buchen" class="nav-item">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <span class="nav-text">Zahlung buchen</span>
          </router-link>

          <!-- Mahnwesen -->
          <router-link to="/mahnwesen" class="nav-item">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2"/>
                <path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="nav-text">Mahnwesen</span>
          </router-link>

          <!-- Firmenverwaltung -->
          <router-link to="/firmenverwaltung" class="nav-item">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2"/>
                <path d="M9 22V12h6v10" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <span class="nav-text">Firmenverwaltung</span>
          </router-link>

          <!-- Benutzerverwaltung -->
          <a href="#" class="nav-item" @click.prevent>
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <span class="nav-text">Benutzerverwaltung</span>
          </a>

          <!-- Frühzeitige Übernahme -->
          <router-link to="/uebernahmen" class="nav-item">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <span class="nav-text">Frühzeitige Übernahme</span>
          </router-link>

          <!-- Einstellungen -->
          <router-link to="/einstellungen" class="nav-item">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                <path d="M12 1v6m0 6v6M23 12h-6m-6 0H5" stroke="currentColor" stroke-width="2"/>
                <path d="m19.07 4.93-4.24 4.24m0 5.66 4.24 4.24M4.93 4.93l4.24 4.24m5.66 0 4.24-4.24M4.93 19.07l4.24-4.24" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <span class="nav-text">Einstellungen</span>
          </router-link>
        </div>

        <button @click="logout" class="logout-btn">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span class="nav-text">Abmelden</span>
        </button>
        </div>
      </nav>

      <!-- MAIN CONTENT -->
      <main class="main-content" :class="{ expanded: sidebarCollapsed }">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const sidebarCollapsed = ref(false)

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function logout() {
  localStorage.removeItem('token')
  router.push('/login')
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #0a0a0a 100%);
}

/* TOP HEADER */
.top-header {
  height: 70px;
  background: rgba(20, 20, 20, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 0, 110, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.subtitle {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.notification-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.notification-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 0, 110, 0.3);
}

.notification-btn svg {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.8);
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.user-menu:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 0, 110, 0.3);
}

.user-name {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
}

.user-role {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
}

/* CONTENT WRAPPER */
.content-wrapper {
  display: flex;
  margin-top: 70px;
}

/* SIDEBAR */
.sidebar {
  width: 300px;
  background: rgba(20, 20, 20, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 0, 110, 0.2);
  position: fixed;
  left: 0;
  top: 70px;
  bottom: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: visible;
  transition: width 0.3s ease;
}

.sidebar.collapsed {
  width: 70px;
}

.sidebar.collapsed .nav-text {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.sidebar.collapsed .badge-red {
  display: none;
}

.toggle-btn {
  position: absolute;
  top: 1rem;
  right: -16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #ff006e;
  background: rgba(20, 20, 20, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 0 12px rgba(255, 0, 110, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 10;
  transition: all 0.3s;
}

.toggle-btn:hover {
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  border-color: transparent;
}

.toggle-btn:hover svg {
  color: white;
}

.toggle-btn svg {
  width: 18px;
  height: 18px;
  color: white;
  transition: transform 0.3s, color 0.3s;
}

.sidebar-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-links {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0 1rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s;
  position: relative;
  white-space: nowrap;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
}

.nav-item.router-link-active {
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  color: white;
}

.nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-icon svg {
  width: 18px;
  height: 18px;
}

.nav-text {
  flex: 1;
  transition: opacity 0.3s, width 0.3s;
}

.badge-red {
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  min-width: 24px;
  text-align: center;
  transition: opacity 0.3s;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  margin: 0 1rem;
  border-radius: 10px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.1);
  color: #ff6b6b;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
}

.logout-btn svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* MAIN CONTENT */
.main-content {
  flex: 1;
  margin-left: 300px;
  min-height: calc(100vh - 70px);
  background: transparent;
  transition: margin-left 0.3s ease;
}

.main-content.expanded {
  margin-left: 70px;
}

/* Scrollbar */
.sidebar-inner::-webkit-scrollbar {
  width: 6px;
}

.sidebar-inner::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.sidebar-inner::-webkit-scrollbar-thumb {
  background: rgba(255, 0, 110, 0.3);
  border-radius: 10px;
}

.sidebar-inner::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 0, 110, 0.5);
}
</style>
