<template>
  <div class="layout" @click="closeAllDropdowns">
    <!-- TOP HEADER -->
    <header class="top-header">
      <div class="header-left">
        <h1 class="brand">NightDUTY</h1>
        <span class="subtitle">Buchhaltungssystem</span>
      </div>
      <div class="header-right">
        <!-- Notification Bell -->
        <div class="notification-wrapper">
          <button class="notification-btn" @click.stop="toggleNotifications">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span class="badge">{{ notifications.length }}</span>
          </button>
          <!-- Notifications Dropdown -->
          <div v-if="showNotifications" class="dropdown notifications-dropdown" @click.stop>
            <div class="dropdown-header">
              <span>Benachrichtigungen</span>
              <button class="mark-all-read" @click="markAllAsRead">Alle als gelesen</button>
            </div>
            <div class="dropdown-content">
              <div v-if="notifications.length === 0" class="empty-state">
                Keine neuen Benachrichtigungen
              </div>
              <div v-for="notification in notifications" :key="notification.id" class="notification-item">
                <div class="notification-icon" :class="notification.type">
                  <svg v-if="notification.type === 'payment'" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  <svg v-else-if="notification.type === 'company'" viewBox="0 0 24 24" fill="none">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
                <div class="notification-text">
                  <div class="notification-title">{{ notification.title }}</div>
                  <div class="notification-time">{{ notification.time }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- User Menu -->
        <div class="user-menu-wrapper">
          <div class="user-menu" @click.stop="toggleUserMenu">
            <div>
              <div class="user-name">Admin</div>
              <div class="user-role">Administrator</div>
            </div>
            <div class="user-avatar">AD</div>
          </div>
          <!-- User Menu Dropdown -->
          <div v-if="showUserMenu" class="dropdown user-dropdown" @click.stop>
            <div class="dropdown-item disabled">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
              </svg>
              <span>Profil</span>
            </div>
            <div class="dropdown-item" @click="openPasswordModal">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="2"/>
              </svg>
              <span>Passwort ändern</span>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item logout" @click="logout">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="2"/>
              </svg>
              <span>Abmelden</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Password Change Modal -->
    <div v-if="showPasswordModal" class="modal-overlay" @click="closePasswordModal">
      <div class="modal password-modal" @click.stop>
        <div class="modal-header">
          <h2>Passwort ändern</h2>
          <button @click="closePasswordModal" class="close-btn">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>
        <form @submit.prevent="handlePasswordChange" class="modal-form">
          <div class="form-group">
            <label>Aktuelles Passwort</label>
            <input v-model="passwordForm.currentPassword" type="password" required />
          </div>
          <div class="form-group">
            <label>Neues Passwort</label>
            <input v-model="passwordForm.newPassword" type="password" required />
          </div>
          <div class="form-group">
            <label>Passwort bestätigen</label>
            <input v-model="passwordForm.confirmPassword" type="password" required />
          </div>
          <div v-if="passwordError" class="error-message">{{ passwordError }}</div>
          <div v-if="passwordSuccess" class="success-message">{{ passwordSuccess }}</div>
          <div class="modal-footer">
            <button type="button" @click="closePasswordModal" class="btn-secondary">Abbrechen</button>
            <button type="submit" class="btn-primary" :disabled="passwordSaving">
              {{ passwordSaving ? 'Speichern...' : 'Speichern' }}
            </button>
          </div>
        </form>
      </div>
    </div>

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
          <router-link to="/benutzerverwaltung" class="nav-item">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <span class="nav-text">Benutzerverwaltung</span>
          </router-link>

          <!-- Frühzeitige Übernahme -->
          <router-link to="/uebernahmen" class="nav-item">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <span class="nav-text">Frühzeitige Übernahme</span>
          </router-link>

          <!-- Stundenausgleich -->
          <router-link to="/stundenausgleich" class="nav-item">
            <div class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <span class="nav-text">Stundenausgleich</span>
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

// Dropdown states
const showNotifications = ref(false)
const showUserMenu = ref(false)
const showPasswordModal = ref(false)

// Password change form
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordError = ref('')
const passwordSuccess = ref('')
const passwordSaving = ref(false)

// Mock notifications data
const mockNotifications = [
  { id: 1, title: 'Rechnung #123 bezahlt', time: 'vor 5 Minuten', type: 'payment' },
  { id: 2, title: 'Neue Firma angelegt', time: 'vor 1 Stunde', type: 'company' },
  { id: 3, title: 'Mahnung #45 versendet', time: 'vor 2 Stunden', type: 'info' }
]

// Initialize notifications based on localStorage flag
function getInitialNotifications() {
  try {
    return localStorage.getItem('notificationsRead') ? [] : mockNotifications
  } catch {
    return mockNotifications
  }
}
const notifications = ref(getInitialNotifications())

// Timing constants (in milliseconds)
const API_SIMULATION_DELAY = 1000
const SUCCESS_MESSAGE_DISPLAY_TIME = 1500

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  showUserMenu.value = false
}

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
  showNotifications.value = false
}

function closeAllDropdowns() {
  showNotifications.value = false
  showUserMenu.value = false
}

function markAllAsRead() {
  notifications.value = []
  try {
    localStorage.setItem('notificationsRead', 'true')
  } catch {
    // Ignore localStorage errors (e.g., quota exceeded, disabled)
  }
}

function openPasswordModal() {
  showUserMenu.value = false
  showPasswordModal.value = true
  passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  passwordError.value = ''
  passwordSuccess.value = ''
}

function closePasswordModal() {
  showPasswordModal.value = false
  passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  passwordError.value = ''
  passwordSuccess.value = ''
}

async function handlePasswordChange() {
  passwordError.value = ''
  passwordSuccess.value = ''

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'Die Passwörter stimmen nicht überein'
    return
  }

  if (passwordForm.value.newPassword.length < 6) {
    passwordError.value = 'Das neue Passwort muss mindestens 6 Zeichen lang sein'
    return
  }

  passwordSaving.value = true

  try {
    // Dummy handler - prepare for API call to /api/auth/change-password
    // const token = localStorage.getItem('token')
    // await axios.post('/api/auth/change-password', {
    //   currentPassword: passwordForm.value.currentPassword,
    //   newPassword: passwordForm.value.newPassword
    // }, { headers: { Authorization: `Bearer ${token}` } })
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, API_SIMULATION_DELAY))
    
    passwordSuccess.value = 'Passwort erfolgreich geändert!'
    setTimeout(() => {
      closePasswordModal()
    }, SUCCESS_MESSAGE_DISPLAY_TIME)
  } catch {
    passwordError.value = 'Fehler beim Ändern des Passworts'
  } finally {
    passwordSaving.value = false
  }
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

/* Notification and User Menu Wrappers */
.notification-wrapper,
.user-menu-wrapper {
  position: relative;
}

/* Dropdown Base Styles */
.dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: #1e293b;
  border: 1px solid rgba(255, 0, 110, 0.3);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 0, 110, 0.1);
  z-index: 200;
  overflow: hidden;
  animation: dropdownFadeIn 0.2s ease-out;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Notifications Dropdown */
.notifications-dropdown {
  width: 340px;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dropdown-header span {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
}

.mark-all-read {
  background: none;
  border: none;
  color: #ff006e;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
}

.mark-all-read:hover {
  color: #8338ec;
}

.dropdown-content {
  max-height: 300px;
  overflow-y: auto;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.2s;
  cursor: pointer;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.notification-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-icon.payment {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.notification-icon.company {
  background: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
}

.notification-icon.info {
  background: rgba(255, 0, 110, 0.2);
  color: #ff006e;
}

.notification-icon svg {
  width: 18px;
  height: 18px;
}

.notification-text {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.25rem;
}

.notification-time {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

/* User Menu Dropdown */
.user-dropdown {
  width: 200px;
  padding: 0.5rem 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.dropdown-item:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.dropdown-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dropdown-item.logout {
  color: #ff6b6b;
}

.dropdown-item.logout:hover {
  background: rgba(239, 68, 68, 0.1);
}

.dropdown-item svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.dropdown-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.5rem 0;
}

/* Password Modal */
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
  background: #1e293b;
  border: 1px solid rgba(255, 0, 110, 0.3);
  border-radius: 16px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 0, 110, 0.1);
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
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
  margin: 0;
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

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.form-group input:focus {
  outline: none;
  border-color: #ff006e;
  box-shadow: 0 0 0 3px rgba(255, 0, 110, 0.15);
  background: rgba(255, 255, 255, 0.08);
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.success-message {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  border: none;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  color: #ffffff;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(255, 0, 110, 0.3);
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 6px 16px rgba(255, 0, 110, 0.4);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Dropdown scrollbar */
.dropdown-content::-webkit-scrollbar {
  width: 6px;
}

.dropdown-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.dropdown-content::-webkit-scrollbar-thumb {
  background: rgba(255, 0, 110, 0.3);
  border-radius: 10px;
}
</style>
