import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// Get overdue invoices
router.get('/overdue', authenticateToken, async (req, res) => {
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
            phone: true
          }
        },
        dunnings: {
          orderBy: {
            created_at: 'desc'
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

// Create a dunning notice
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { invoice_id, dunning_level, new_due_date, fee_amount } = req.body
    const username = (req as any).user?.username || 'system'
    
    if (!invoice_id || !dunning_level || !new_due_date || fee_amount === undefined) {
      return res.status(400).json({ error: 'Alle Felder sind erforderlich' })
    }
    
    // Check if invoice exists and is overdue
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(invoice_id) }
    })
    
    if (!invoice) {
      return res.status(404).json({ error: 'Rechnung nicht gefunden' })
    }
    
    if (invoice.status !== 'open') {
      return res.status(400).json({ error: 'Rechnung ist nicht mehr offen' })
    }
    
    // Create dunning notice
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
    
    // Update invoice dunning level
    await prisma.invoice.update({
      where: { id: parseInt(invoice_id) },
      data: {
        dunning_level: parseInt(dunning_level)
      }
    })
    
    res.json(dunning)
  } catch (error) {
    console.error('Error creating dunning notice:', error)
    res.status(500).json({ error: 'Fehler beim Erstellen der Mahnung' })
  }
})

export default router
