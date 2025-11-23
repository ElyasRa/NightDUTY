import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// Alle Übernahmen abrufen
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { company_id } = req.query
    
    const where = company_id ? { company_id: parseInt(company_id as string) } : {}
    
    const takeovers = await prisma.earlyTakeover.findMany({
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
    
    res.json(takeovers)
  } catch (error) {
    console.error('Error fetching takeovers:', error)
    res.status(500).json({ error: 'Fehler beim Abrufen der Übernahmen' })
  }
})

// Neue Übernahme erstellen
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { company_id, start_date, end_date, start_time, end_time, notes } = req.body
    
    if (!company_id || !start_date || !end_date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Alle Pflichtfelder müssen ausgefüllt werden' })
    }
    
    const takeover = await prisma.earlyTakeover.create({
      data: {
        company_id: parseInt(company_id),
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        start_time,
        end_time,
        notes: notes || null,
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
    
    res.json(takeover)
  } catch (error) {
    console.error('Error creating takeover:', error)
    res.status(500).json({ error: 'Fehler beim Erstellen der Übernahme' })
  }
})

// Übernahme löschen
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    
    await prisma.earlyTakeover.delete({
      where: { id: parseInt(id) }
    })
    
    res.json({ message: 'Übernahme gelöscht' })
  } catch (error) {
    console.error('Error deleting takeover:', error)
    res.status(500).json({ error: 'Fehler beim Löschen der Übernahme' })
  }
})

// Übernahmen für einen Zeitraum abrufen
router.get('/range', authenticateToken, async (req, res) => {
  try {
    const { company_id, start_date, end_date } = req.query
    
    if (!company_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'Firma und Zeitraum erforderlich' })
    }
    
    const takeovers = await prisma.earlyTakeover.findMany({
      where: {
        company_id: parseInt(company_id as string),
        OR: [
          {
            AND: [
              { start_date: { lte: new Date(end_date as string) } },
              { end_date: { gte: new Date(start_date as string) } }
            ]
          }
        ]
      }
    })
    
    res.json(takeovers)
  } catch (error) {
    console.error('Error fetching takeovers for range:', error)
    res.status(500).json({ error: 'Fehler beim Abrufen der Übernahmen' })
  }
})

export default router
