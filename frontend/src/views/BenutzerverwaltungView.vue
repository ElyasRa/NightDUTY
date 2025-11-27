<template>
  <MainLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>👥 Benutzerverwaltung</h1>
          <p>Benutzer erstellen, bearbeiten und löschen</p>
        </div>
        <button @click="openCreateModal" class="btn-primary">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Neuer Benutzer
        </button>
      </div>

      <!-- User List -->
      <div class="users-container">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          Lade Benutzer...
        </div>
        <div v-else-if="users.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <h2>Keine Benutzer vorhanden</h2>
          <p class="empty-description">
            Klicken Sie auf "Neuer Benutzer", um einen Benutzer hinzuzufügen.
          </p>
        </div>
        <div v-else class="users-table-wrapper">
          <table class="users-table">
            <thead>
              <tr>
                <th>Benutzername</th>
                <th>Rolle</th>
                <th>Erstellt am</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>
                  <div class="user-info">
                    <div class="user-avatar">
                      {{ user.username.charAt(0).toUpperCase() }}
                    </div>
                    <span>{{ user.username }}</span>
                  </div>
                </td>
                <td>
                  <span :class="['role-badge', user.role === 'admin' ? 'role-admin' : 'role-user']">
                    {{ user.role === 'admin' ? 'Administrator' : 'Benutzer' }}
                  </span>
                </td>
                <td>{{ formatDate(user.created_at) }}</td>
                <td>
                  <div class="action-buttons">
                    <button @click="openPasswordModal(user)" class="btn-action btn-edit" title="Passwort ändern">
                      <svg viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="2"/>
                      </svg>
                    </button>
                    <button @click="deleteUser(user)" class="btn-action btn-delete" title="Benutzer löschen">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create User Modal -->
      <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h2>Neuer Benutzer</h2>
            <button @click="closeCreateModal" class="close-btn">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <form @submit.prevent="createUser" class="modal-form">
            <div class="form-group">
              <label>Benutzername *</label>
              <input v-model="createFormData.username" type="text" required placeholder="Benutzername eingeben..." />
            </div>

            <div class="form-group">
              <label>Passwort *</label>
              <input v-model="createFormData.password" type="password" required placeholder="Passwort eingeben..." />
            </div>

            <div class="form-group">
              <label>Rolle *</label>
              <select v-model="createFormData.role" required>
                <option value="user">Benutzer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div v-if="error" class="error-message">{{ error }}</div>

            <div class="modal-footer">
              <button type="button" @click="closeCreateModal" class="btn-secondary">Abbrechen</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Speichern...' : 'Erstellen' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Change Password Modal -->
      <div v-if="showPasswordModal" class="modal-overlay" @click="closePasswordModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h2>Passwort ändern</h2>
            <button @click="closePasswordModal" class="close-btn">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <form @submit.prevent="changePassword" class="modal-form">
            <div class="info-box">
              <div class="info-icon">🔐</div>
              <div class="info-content">
                <strong>Benutzer: {{ selectedUser?.username }}</strong>
                <p>Geben Sie ein neues Passwort für diesen Benutzer ein.</p>
              </div>
            </div>

            <div class="form-group">
              <label>Neues Passwort *</label>
              <input v-model="passwordFormData.password" type="password" required placeholder="Neues Passwort eingeben..." />
            </div>

            <div class="form-group">
              <label>Passwort bestätigen *</label>
              <input v-model="passwordFormData.confirmPassword" type="password" required placeholder="Passwort bestätigen..." />
            </div>

            <div v-if="error" class="error-message">{{ error }}</div>

            <div class="modal-footer">
              <button type="button" @click="closePasswordModal" class="btn-secondary">Abbrechen</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Speichern...' : 'Passwort ändern' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import axios from 'axios'
import { API_BASE_URL } from '../config'

interface User {
  id: number
  username: string
  role: string
  created_at: string
}

const users = ref<User[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')

const showCreateModal = ref(false)
const showPasswordModal = ref(false)
const selectedUser = ref<User | null>(null)

const createFormData = ref({
  username: '',
  password: '',
  role: 'user'
})

const passwordFormData = ref({
  password: '',
  confirmPassword: ''
})

async function fetchUsers() {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    users.value = response.data
  } catch (err) {
    console.error('Error fetching users:', err)
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  createFormData.value = {
    username: '',
    password: '',
    role: 'user'
  }
  error.value = ''
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

function openPasswordModal(user: User) {
  selectedUser.value = user
  passwordFormData.value = {
    password: '',
    confirmPassword: ''
  }
  error.value = ''
  showPasswordModal.value = true
}

function closePasswordModal() {
  showPasswordModal.value = false
  selectedUser.value = null
}

async function createUser() {
  if (!createFormData.value.username || !createFormData.value.password) {
    error.value = 'Bitte füllen Sie alle Felder aus'
    return
  }

  saving.value = true
  error.value = ''

  try {
    const token = localStorage.getItem('token')
    await axios.post(
      `${API_BASE_URL}/users`,
      createFormData.value,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    await fetchUsers()
    closeCreateModal()
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Fehler beim Erstellen des Benutzers'
  } finally {
    saving.value = false
  }
}

async function changePassword() {
  if (!passwordFormData.value.password || !passwordFormData.value.confirmPassword) {
    error.value = 'Bitte füllen Sie alle Felder aus'
    return
  }

  if (passwordFormData.value.password !== passwordFormData.value.confirmPassword) {
    error.value = 'Die Passwörter stimmen nicht überein'
    return
  }

  if (!selectedUser.value) return

  saving.value = true
  error.value = ''

  try {
    const token = localStorage.getItem('token')
    await axios.put(
      `${API_BASE_URL}/users/${selectedUser.value.id}`,
      { password: passwordFormData.value.password },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    closePasswordModal()
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Fehler beim Ändern des Passworts'
  } finally {
    saving.value = false
  }
}

async function deleteUser(user: User) {
  if (!confirm(`Möchten Sie den Benutzer "${user.username}" wirklich löschen?`)) return

  try {
    const token = localStorage.getItem('token')
    await axios.delete(
      `${API_BASE_URL}/users/${user.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    await fetchUsers()
  } catch (err: any) {
    alert(err.response?.data?.error || 'Fehler beim Löschen des Benutzers')
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(() => {
  fetchUsers()
})
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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(255, 0, 110, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-primary svg {
  width: 18px;
  height: 18px;
}

/* Users Container */
.users-container {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.loading {
  text-align: center;
  padding: 4rem 2rem;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 0, 110, 0.15) 0%, rgba(131, 56, 236, 0.15) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.empty-icon svg {
  width: 40px;
  height: 40px;
  color: #ff006e;
}

.empty-state h2 {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.75rem;
}

.empty-description {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  line-height: 1.6;
  max-width: 400px;
}

/* Users Table */
.users-table-wrapper {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 1rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.users-table th {
  background: rgba(255, 255, 255, 0.05);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.users-table td {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
}

.users-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.users-table tbody tr:last-child td {
  border-bottom: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  font-size: 0.875rem;
}

.role-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.role-admin {
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #a78bfa;
}

.role-user {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
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

.btn-action svg {
  width: 18px;
  height: 18px;
}

.btn-edit {
  color: #8b5cf6;
}

.btn-edit:hover {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
}

.btn-delete {
  color: #ef4444;
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
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
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
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
  font-size: 1.5rem;
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
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  transition: all 0.2s;
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

.info-box {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.info-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.info-content strong {
  display: block;
  color: #a78bfa;
  margin-bottom: 0.25rem;
  font-size: 1rem;
}

.info-content p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  margin: 0;
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

/* Responsive */
@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
  }

  .users-table th,
  .users-table td {
    padding: 0.75rem 1rem;
  }

  .empty-icon {
    width: 64px;
    height: 64px;
  }

  .empty-icon svg {
    width: 32px;
    height: 32px;
  }
}
</style>
