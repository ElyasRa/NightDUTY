import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth'
import { getFederalStateFromPostalCode } from '../utils/postalCodeHelper'

const router = Router()
const prisma = new PrismaClient()

// Alle Firmen abrufen
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { active } = req.query
    const where = active === 'true' ? { is_active: true } : {}
    
    const companies = await prisma.company.findMany({
      where,
      orderBy: { name: 'asc' }
    })
    
    res.json(companies)
  } catch (error) {
    console.error('Error fetching companies:', error)
    res.status(500).json({ error: 'Fehler beim Abrufen der Firmen' })
  }
})

// Firma erstellen
router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = req.body
    
    console.log('📥 Empfangene Daten:', JSON.stringify(data, null, 2))
    
    // Bundesland aus PLZ ermitteln
    if (data.postal_code) {
      const federalState = getFederalStateFromPostalCode(data.postal_code)
      if (federalState) {
        data.federal_state = federalState
      }
    }
    
    // Preise konvertieren
    if (data.billing_type === 'hourly' && data.hourly_rate) {
      data.hourly_rate = parseFloat(data.hourly_rate)
    }
    
    if (data.billing_type === 'per_job') {
      if (data.price_pkw) data.price_pkw = parseFloat(data.price_pkw)
      if (data.price_lkw) data.price_lkw = parseFloat(data.price_lkw)
      if (data.price_oilspill) data.price_oilspill = parseFloat(data.price_oilspill)
    }
    
    // Parse early_takeover_price
    if (data.early_takeover_price !== undefined && data.early_takeover_price !== null) data.early_takeover_price = parseFloat(data.early_takeover_price)
    
    // ID entfernen bei CREATE
    delete data.id

    const company = await prisma.company.create({ data })
    
    console.log('✅ Firma erstellt:', company)
    
    res.json(company)
  } catch (error: any) {
    console.error('❌ Error creating company:', error)
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Eine Firma mit diesem Namen existiert bereits' })
    } else {
      res.status(500).json({ error: 'Fehler beim Erstellen der Firma' })
    }
  }
})

// Firma aktualisieren
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body
    
    console.log('📥 Update Daten für ID', id, ':', JSON.stringify(data, null, 2))
    
    // Bundesland aus PLZ ermitteln
    if (data.postal_code) {
      const federalState = getFederalStateFromPostalCode(data.postal_code)
      if (federalState) {
        data.federal_state = federalState
      }
    }
    
    // Preise konvertieren
    if (data.billing_type === 'hourly') {
      if (data.hourly_rate) data.hourly_rate = parseFloat(data.hourly_rate)
      // Andere Preise auf null setzen
      data.price_pkw = null
      data.price_lkw = null
      data.price_oilspill = null
    }
    
    if (data.billing_type === 'per_job') {
      if (data.price_pkw) data.price_pkw = parseFloat(data.price_pkw)
      if (data.price_lkw) data.price_lkw = parseFloat(data.price_lkw)
      if (data.price_oilspill) data.price_oilspill = parseFloat(data.price_oilspill)
      // Stundenlohn auf null setzen
      data.hourly_rate = null
    }
    
    // Parse early_takeover_price
    if (data.early_takeover_price !== undefined && data.early_takeover_price !== null) data.early_takeover_price = parseFloat(data.early_takeover_price)
    
    // ID aus data entfernen
    delete data.id
    
    const company = await prisma.company.update({
      where: { id: parseInt(id) },
      data
    })
    
    console.log('✅ Firma aktualisiert:', company)
    
    res.json(company)
  } catch (error: any) {
    console.error('❌ Error updating company:', error)
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Eine Firma mit diesem Namen existiert bereits' })
    } else {
      res.status(500).json({ error: 'Fehler beim Aktualisieren der Firma' })
    }
  }
})

// Firma löschen
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    
    await prisma.company.delete({
      where: { id: parseInt(id) }
    })
    
    res.json({ message: 'Firma gelöscht' })
  } catch (error) {
    console.error('Error deleting company:', error)
    res.status(500).json({ error: 'Fehler beim Löschen der Firma' })
  }
})

export default router
