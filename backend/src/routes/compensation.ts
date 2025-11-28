import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// Get all compensations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { company_id } = req.query
    
    const where = company_id ? { company_id: parseInt(company_id as string) } : {}
    
    const compensations = await prisma.hoursCompensation.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        start_date: 'desc'
      }
    })
    
    res.json(compensations)
  } catch (error) {
    console.error('Error fetching compensations:', error)
    res.status(500).json({ error: 'Fehler beim Abrufen der Stundenausgleiche' })
  }
})

// Create new compensation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { company_id, start_date, end_date, total_hours } = req.body
    
    if (!company_id || !start_date || !end_date || total_hours === undefined) {
      return res.status(400).json({ error: 'Alle Pflichtfelder müssen ausgefüllt werden' })
    }
    
    const startDateObj = new Date(start_date)
    const endDateObj = new Date(end_date)
    
    if (startDateObj > endDateObj) {
      return res.status(400).json({ error: 'Startdatum muss vor dem Enddatum liegen' })
    }
    
    const compensation = await prisma.hoursCompensation.create({
      data: {
        company_id: parseInt(company_id),
        start_date: startDateObj,
        end_date: endDateObj,
        total_hours: parseFloat(total_hours),
        created_by: (req as any).user?.username || 'system'
      },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    res.json(compensation)
  } catch (error) {
    console.error('Error creating compensation:', error)
    res.status(500).json({ error: 'Fehler beim Erstellen des Stundenausgleichs' })
  }
})

// Delete compensation
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    
    // Check if compensation exists before deletion
    const existing = await prisma.hoursCompensation.findUnique({
      where: { id: parseInt(id) }
    })
    
    if (!existing) {
      return res.status(404).json({ error: 'Stundenausgleich nicht gefunden' })
    }
    
    await prisma.hoursCompensation.delete({
      where: { id: parseInt(id) }
    })
    
    res.json({ message: 'Stundenausgleich gelöscht' })
  } catch (error) {
    console.error('Error deleting compensation:', error)
    res.status(500).json({ error: 'Fehler beim Löschen des Stundenausgleichs' })
  }
})

export default router
