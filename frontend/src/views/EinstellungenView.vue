<template>
  <MainLayout>
    <div class="container">
      <div class="header">
        <h1 class="title">⚙️ Einstellungen</h1>
        <p class="subtitle">Systemweite Einstellungen verwalten</p>
      </div>

      <div v-if="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <!-- SMTP Settings Section -->
      <div class="card">
        <h2 class="card-title">📧 E-Mail Server (SMTP)</h2>
        
        <div class="form-grid">
          <div class="form-group">
            <label>SMTP Host *</label>
            <input 
              v-model="settings.smtp_host" 
              type="text" 
              class="input"
              placeholder="smtp.example.com"
            />
          </div>

          <div class="form-group">
            <label>SMTP Port *</label>
            <input 
              v-model.number="settings.smtp_port" 
              type="number" 
              class="input"
              placeholder="587"
            />
          </div>

          <div class="form-group">
            <label>SMTP Benutzername *</label>
            <input 
              v-model="settings.smtp_user" 
              type="text" 
              class="input"
              placeholder="user@example.com"
            />
          </div>

          <div class="form-group">
            <label>SMTP Passwort *</label>
            <input 
              v-model="settings.smtp_password" 
              type="password" 
              class="input"
              placeholder="••••••••"
            />
          </div>

          <div class="form-group full-width">
            <label>Absender E-Mail *</label>
            <input 
              v-model="settings.smtp_from_address" 
              type="email" 
              class="input"
              placeholder="noreply@example.com"
            />
          </div>
        </div>

        <div class="button-group">
          <button @click="testConnection" class="btn btn-secondary" :disabled="loading">
            <span v-if="!testing">🔌 Verbindung testen</span>
            <span v-else>⏳ Teste...</span>
          </button>
        </div>
      </div>

      <!-- Email Templates Section -->
      <div class="card">
        <h2 class="card-title">📝 E-Mail-Vorlagen</h2>
        
        <div class="template-section">
          <h3 class="template-title">Rechnung versenden</h3>
          <div class="form-group">
            <label>Betreff</label>
            <input 
              v-model="settings.email_invoice_subject" 
              type="text" 
              class="input"
              placeholder="Rechnung {{invoice_number}} - {{company_name}}"
            />
            <p class="help-text">{{ invoicePlaceholders }}</p>
          </div>

          <div class="form-group">
            <label>Nachricht</label>
            <textarea 
              v-model="settings.email_invoice_body" 
              class="textarea"
              rows="6"
              placeholder="Sehr geehrte Damen und Herren,..."
            ></textarea>
            <p class="help-text">{{ invoicePlaceholders }}</p>
          </div>
        </div>

        <div class="template-section">
          <h3 class="template-title">Mahnung versenden</h3>
          <div class="form-group">
            <label>Betreff</label>
            <input 
              v-model="settings.email_dunning_subject" 
              type="text" 
              class="input"
              placeholder="Mahnung - Rechnung {{invoice_number}}"
            />
            <p class="help-text">{{ dunningPlaceholders }}</p>
          </div>

          <div class="form-group">
            <label>Nachricht</label>
            <textarea 
              v-model="settings.email_dunning_body" 
              class="textarea"
              rows="6"
              placeholder="Sehr geehrte Damen und Herren,..."
            ></textarea>
            <p class="help-text">{{ dunningPlaceholders }}</p>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="actions">
        <button @click="saveSettings" class="btn btn-primary" :disabled="loading">
          <span v-if="!loading">💾 Einstellungen speichern</span>
          <span v-else>⏳ Speichere...</span>
        </button>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import MainLayout from '../layouts/MainLayout.vue'
import { API_BASE_URL } from '../config'

const PLACEHOLDER_INVOICE = '{{invoice_number}}, {{company_name}}, {{period}}'
const PLACEHOLDER_DUNNING = '{{invoice_number}}, {{company_name}}'

const invoicePlaceholders = computed(() => `Verfügbare Platzhalter: ${PLACEHOLDER_INVOICE}`)
const dunningPlaceholders = computed(() => `Verfügbare Platzhalter: ${PLACEHOLDER_DUNNING}`)

const settings = ref({
  smtp_host: '',
  smtp_port: 587,
  smtp_user: '',
  smtp_password: '',
  smtp_from_address: '',
  email_invoice_subject: 'Rechnung {{invoice_number}} - {{company_name}}',
  email_invoice_body: 'Sehr geehrte Damen und Herren,\n\nim Anhang finden Sie die Rechnung {{invoice_number}} sowie den Stundenreport für den Zeitraum {{period}}.\n\nVielen Dank für Ihre Zusammenarbeit.\n\nMit freundlichen Grüßen\nIhr NightDUTY Team',
  email_dunning_subject: 'Mahnung - Rechnung {{invoice_number}}',
  email_dunning_body: 'Sehr geehrte Damen und Herren,\n\nleider haben wir noch keine Zahlung für die Rechnung {{invoice_number}} erhalten.\n\nBitte begleichen Sie den offenen Betrag umgehend.\n\nMit freundlichen Grüßen\nIhr NightDUTY Team'
})

const loading = ref(false)
const testing = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

onMounted(async () => {
  await loadSettings()
})

async function loadSettings() {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE_URL}/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (response.data) {
      settings.value = { ...settings.value, ...response.data }
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

async function testConnection() {
  testing.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const token = localStorage.getItem('token')
    const response = await axios.post(
      `${API_BASE_URL}/settings/test-connection`,
      {
        smtp_host: settings.value.smtp_host,
        smtp_port: settings.value.smtp_port,
        smtp_user: settings.value.smtp_user,
        smtp_password: settings.value.smtp_password
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    if (response.data.success) {
      successMessage.value = '✅ ' + response.data.message
    } else {
      errorMessage.value = '❌ ' + response.data.message
    }
  } catch (error: any) {
    errorMessage.value = '❌ Fehler beim Testen der Verbindung: ' + (error.response?.data?.error || error.message)
  } finally {
    testing.value = false
  }
}

async function saveSettings() {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const token = localStorage.getItem('token')
    await axios.post(
      `${API_BASE_URL}/settings`,
      settings.value,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    successMessage.value = '✅ Einstellungen erfolgreich gespeichert!'
    
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error: any) {
    errorMessage.value = '❌ Fehler beim Speichern: ' + (error.response?.data?.error || error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #0a0a0a 100%);
}

.header {
  margin-bottom: 2rem;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: #ff006e;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
}

.alert {
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.alert-success {
  background-color: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.alert-error {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #ff006e;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.input,
.textarea {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 0.875rem;
  color: #ffffff;
  transition: all 0.2s;
}

.input::placeholder,
.textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.input:focus,
.textarea:focus {
  outline: none;
  border-color: #ff006e;
  box-shadow: 0 0 0 3px rgba(255, 0, 110, 0.15);
  background: rgba(255, 255, 255, 0.08);
}

.textarea {
  resize: vertical;
  font-family: inherit;
}

.help-text {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.25rem;
}

.button-group {
  display: flex;
  gap: 1rem;
}

.template-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.template-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.template-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 1rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  color: white;
  box-shadow: 0 8px 24px rgba(255, 0, 110, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(255, 0, 110, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}
</style>
