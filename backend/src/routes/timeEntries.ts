import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// Alle Zeiteinträge abrufen (mit Filter)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { company_id, start_date, end_date, user_id } = req.query
    
    const where: any = {}
    
    if (company_id) {
      where.company_id = parseInt(company_id as string)
    }
    
    if (user_id) {
      where.user_id = parseInt(user_id as string)
    } else if (req.user) {
      // Nur eigene Einträge anzeigen
      where.user_id = req.user.id
    }
    
    if (start_date && end_date) {
      where.date = {
        gte: new Date(start_date as string),
        lte: new Date(end_date as string)
      }
    }
    
    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            city: true
          }
        },
        user: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { start_time: 'desc' }
      ]
    })
    
    res.json(entries)
  } catch (error) {
    console.error('Error fetching time entries:', error)
    res.status(500).json({ error: 'Fehler beim Abrufen der Zeiteinträge' })
  }
})

// Einzelnen Zeiteintrag abrufen
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    
    const entry = await prisma.timeEntry.findUnique({
      where: { id: parseInt(id) },
      include: {
        company: true,
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })
    
    if (!entry) {
      return res.status(404).json({ error: 'Zeiteintrag nicht gefunden' })
    }
    
    res.json(entry)
  } catch (error) {
    console.error('Error fetching time entry:', error)
    res.status(500).json({ error: 'Fehler beim Abrufen des Zeiteintrags' })
  }
})

// Statistiken abrufen
router.get('/stats/summary', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date, company_id } = req.query
    
    const where: any = {
      user_id: req.user?.id,
      is_completed: true
    }
    
    if (company_id) {
      where.company_id = parseInt(company_id as string)
    }
    
    if (start_date && end_date) {
      where.date = {
        gte: new Date(start_date as string),
        lte: new Date(end_date as string)
      }
    }
    
    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        company: {
          select: {
            name: true
          }
        }
      }
    })
    
    const totalHours = entries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0)
    const totalDays = entries.length
    
    const byCompany = entries.reduce((acc: any, entry) => {
      const companyName = entry.company.name
      if (!acc[companyName]) {
        acc[companyName] = { hours: 0, days: 0 }
      }
      acc[companyName].hours += entry.total_hours || 0
      acc[companyName].days += 1
      return acc
    }, {})
    
    res.json({
      total_hours: Math.round(totalHours * 100) / 100,
      total_days: totalDays,
      by_company: byCompany
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Fehler beim Abrufen der Statistiken' })
  }
})

// Neuen Zeiteintrag erstellen
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      company_id,
      date,
      start_time,
      end_time,
      pause_minutes,
      notes
    } = req.body
    
    if (!company_id || !date || !start_time) {
      return res.status(400).json({ error: 'Firma, Datum und Startzeit sind erforderlich' })
    }
    
    let totalHours = null
    let isCompleted = false
    
    if (end_time) {
      // Stunden berechnen
      const [startH, startM] = start_time.split(':').map(Number)
      const [endH, endM] = end_time.split(':').map(Number)
      
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      const workMinutes = endMinutes - startMinutes - (pause_minutes || 0)
      
      totalHours = Math.round((workMinutes / 60) * 100) / 100
      isCompleted = true
    }
    
    const entry = await prisma.timeEntry.create({
      data: {
        company_id: parseInt(company_id),
        user_id: req.user!.id,
        date: new Date(date),
        start_time,
        end_time: end_time || null,
        pause_minutes: pause_minutes || 0,
        total_hours: totalHours,
        notes: notes || null,
        is_completed: isCompleted
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            city: true
          }
        }
      }
    })
    
    res.status(201).json(entry)
  } catch (error) {
    console.error('Error creating time entry:', error)
    res.status(500).json({ error: 'Fehler beim Erstellen des Zeiteintrags' })
  }
})

// Zeiteintrag aktualisieren
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const {
      company_id,
      date,
      start_time,
      end_time,
      pause_minutes,
      notes
    } = req.body
    
    // Prüfen ob Eintrag existiert und dem User gehört
    const existing = await prisma.timeEntry.findUnique({
      where: { id: parseInt(id) }
    })
    
    if (!existing) {
      return res.status(404).json({ error: 'Zeiteintrag nicht gefunden' })
    }
    
    if (existing.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Keine Berechtigung' })
    }
    
    let totalHours = null
    let isCompleted = false
    
    if (end_time && start_time) {
      const [startH, startM] = start_time.split(':').map(Number)
      const [endH, endM] = end_time.split(':').map(Number)
      
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      const workMinutes = endMinutes - startMinutes - (pause_minutes || 0)
      
      totalHours = Math.round((workMinutes / 60) * 100) / 100
      isCompleted = true
    }
    
    const entry = await prisma.timeEntry.update({
      where: { id: parseInt(id) },
      data: {
        company_id: company_id ? parseInt(company_id) : undefined,
        date: date ? new Date(date) : undefined,
        start_time,
        end_time: end_time || null,
        pause_minutes: pause_minutes || 0,
        total_hours: totalHours,
        notes: notes || null,
        is_completed: isCompleted
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            city: true
          }
        }
      }
    })
    
    res.json(entry)
  } catch (error) {
    console.error('Error updating time entry:', error)
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Zeiteintrags' })
  }
})

// Zeiteintrag löschen
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    
    const existing = await prisma.timeEntry.findUnique({
      where: { id: parseInt(id) }
    })
    
    if (!existing) {
      return res.status(404).json({ error: 'Zeiteintrag nicht gefunden' })
    }
    
    if (existing.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Keine Berechtigung' })
    }
    
    await prisma.timeEntry.delete({
      where: { id: parseInt(id) }
    })
    
    res.json({ message: 'Zeiteintrag erfolgreich gelöscht' })
  } catch (error) {
    console.error('Error deleting time entry:', error)
    res.status(500).json({ error: 'Fehler beim Löschen des Zeiteintrags' })
  }
})

export default router
