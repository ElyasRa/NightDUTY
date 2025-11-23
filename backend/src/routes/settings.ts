import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth'
import { testSmtpConnection } from '../services/emailService'

const router = Router()
const prisma = new PrismaClient()

// GET /api/settings - Retrieve system settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const settings = await prisma.systemSettings.findFirst({
      orderBy: {
        id: 'desc'
      }
    })
    
    if (!settings) {
      // Return default empty settings
      return res.json({
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
    }
    
    res.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ error: 'Fehler beim Abrufen der Einstellungen' })
  }
})

// POST /api/settings - Save system settings
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_password,
      smtp_from_address,
      email_invoice_subject,
      email_invoice_body,
      email_dunning_subject,
      email_dunning_body
    } = req.body
    
    // Check if settings already exist
    const existingSettings = await prisma.systemSettings.findFirst({
      orderBy: {
        id: 'desc'
      }
    })
    
    let settings
    if (existingSettings) {
      // Update existing settings
      settings = await prisma.systemSettings.update({
        where: { id: existingSettings.id },
        data: {
          smtp_host,
          smtp_port: smtp_port ? parseInt(smtp_port) : null,
          smtp_user,
          smtp_password,
          smtp_from_address,
          email_invoice_subject,
          email_invoice_body,
          email_dunning_subject,
          email_dunning_body
        }
      })
    } else {
      // Create new settings
      settings = await prisma.systemSettings.create({
        data: {
          smtp_host,
          smtp_port: smtp_port ? parseInt(smtp_port) : null,
          smtp_user,
          smtp_password,
          smtp_from_address,
          email_invoice_subject,
          email_invoice_body,
          email_dunning_subject,
          email_dunning_body
        }
      })
    }
    
    console.log('✅ Settings saved successfully')
    res.json(settings)
  } catch (error) {
    console.error('Error saving settings:', error)
    res.status(500).json({ error: 'Fehler beim Speichern der Einstellungen' })
  }
})

// POST /api/settings/test-connection - Test SMTP connection
router.post('/test-connection', authenticateToken, async (req, res) => {
  try {
    const { smtp_host, smtp_port, smtp_user, smtp_password } = req.body
    
    if (!smtp_host || !smtp_port || !smtp_user || !smtp_password) {
      return res.status(400).json({ error: 'Alle SMTP-Felder müssen ausgefüllt sein' })
    }
    
    const success = await testSmtpConnection(
      smtp_host,
      parseInt(smtp_port),
      smtp_user,
      smtp_password
    )
    
    if (success) {
      res.json({ success: true, message: 'Verbindung erfolgreich!' })
    } else {
      res.json({ success: false, message: 'Verbindung fehlgeschlagen. Bitte überprüfen Sie die Einstellungen.' })
    }
  } catch (error) {
    console.error('Error testing connection:', error)
    res.status(500).json({ error: 'Fehler beim Testen der Verbindung' })
  }
})

export default router
