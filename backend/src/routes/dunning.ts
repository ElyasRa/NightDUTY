import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// Überfällige Rechnungen abrufen
router.get('/', authenticateToken, async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: 'open',
        due_date: {
          lt: today
        }
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            customer_number: true,
            email: true,
            contact_person: true
          }
        },
        dunnings: {
          orderBy: {
            dunning_date: 'desc'
          }
        }
      },
      orderBy: {
        due_date: 'asc'
      }
    })
    
    res.json(overdueInvoices)
  } catch (error) {
    console.error('Error fetching overdue invoices:', error)
    res.status(500).json({ error: 'Fehler beim Abrufen überfälliger Rechnungen' })
  }
})

// Mahnung erstellen
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { invoice_id, dunning_level, new_due_date, fee_amount } = req.body
    const username = (req as any).user?.username || 'system'
    
    if (!invoice_id || !dunning_level || !new_due_date || fee_amount === undefined || fee_amount < 0) {
      return res.status(400).json({ error: 'Alle Felder sind erforderlich und Mahngebühr darf nicht negativ sein' })
    }
    
    // Prüfe ob Rechnung existiert
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(invoice_id) }
    })
    
    if (!invoice) {
      return res.status(404).json({ error: 'Rechnung nicht gefunden' })
    }
    
    if (invoice.status !== 'open') {
      return res.status(400).json({ error: 'Rechnung ist nicht mehr offen' })
    }
    
    // Erstelle Mahnung
    const dunning = await prisma.dunning.create({
      data: {
        invoice_id: parseInt(invoice_id),
        dunning_level: parseInt(dunning_level),
        dunning_date: new Date(),
        new_due_date: new Date(new_due_date),
        fee_amount: parseFloat(fee_amount),
        created_by: username
      }
    })
    
    // Aktualisiere Rechnung
    await prisma.invoice.update({
      where: { id: parseInt(invoice_id) },
      data: {
        dunning_level: parseInt(dunning_level)
      }
    })
    
    res.json(dunning)
  } catch (error) {
    console.error('Error creating dunning:', error)
    res.status(500).json({ error: 'Fehler beim Erstellen der Mahnung' })
  }
})

// Alle Mahnungen für eine Rechnung abrufen
router.get('/invoice/:invoiceId', authenticateToken, async (req, res) => {
  try {
    const { invoiceId } = req.params
    
    const dunnings = await prisma.dunning.findMany({
      where: {
        invoice_id: parseInt(invoiceId)
      },
      orderBy: {
        dunning_date: 'desc'
      }
    })
    
    res.json(dunnings)
  } catch (error) {
    console.error('Error fetching dunnings:', error)
    res.status(500).json({ error: 'Fehler beim Abrufen der Mahnungen' })
  }
})

export default router
