import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth'
import { generateStundenreportPDF } from '../utils/pdfGenerator'
import { getHolidaysForState } from '../utils/postalCodeHelper'

const router = Router()
const prisma = new PrismaClient()

// Stundenreport für individuellen Zeitraum generieren
router.post('/stundenreport', authenticateToken, async (req, res) => {
  try {
    const { company_id, start_date, end_date } = req.body
    
    if (!company_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'Firma, Start- und Enddatum sind erforderlich' })
    }
    
    // Firma abrufen
    const company = await prisma.company.findUnique({
      where: { id: parseInt(company_id) }
    })
    
    if (!company) {
      return res.status(404).json({ error: 'Firma nicht gefunden' })
    }
    
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)
    
    // Validierung
    if (startDate > endDate) {
      return res.status(400).json({ error: 'Startdatum muss vor dem Enddatum liegen' })
    }
    
    // Jahr aus Startdatum extrahieren
    const year = startDate.getFullYear()
    
    // Feiertage abrufen
    const holidays = company.federal_state 
      ? getHolidaysForState(company.federal_state, year)
      : []
    
    const holidayDates = new Set(holidays.map(h => h.date))
    const holidayMap = new Map(holidays.map(h => [h.date, h.name]))
    
    // WICHTIG: Frühzeitige Übernahmen abrufen!
    const takeovers = await prisma.earlyTakeover.findMany({
      where: {
        company_id: parseInt(company_id),
        start_date: { lte: endDate },
        end_date: { gte: startDate }
      }
    })
    
    console.log(`✅ Gefundene Übernahmen für Report: ${takeovers.length}`)
    takeovers.forEach(t => {
      console.log(`   - ${t.start_date} bis ${t.end_date}: ${t.start_time}-${t.end_time}`)
    })
    
    // Alle Tage im Zeitraum generieren
    const entries = []
    let totalHours = 0
    
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const dayOfWeek = currentDate.getDay()
      
      const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
      const weekdayName = weekdays[dayOfWeek]
      
      // Prüfen ob Feiertag
      const isHoliday = holidayDates.has(dateStr)
      
      // WICHTIG: Prüfen ob Frühzeitige Übernahme!
      const takeover = takeovers.find(t => {
        const tStart = new Date(t.start_date).toISOString().split('T')[0]
        const tEnd = new Date(t.end_date).toISOString().split('T')[0]
        return dateStr >= tStart && dateStr <= tEnd
      })
      
      let startTime = null
      let endTime = null
      let isTakeover = false
      let takeoverNotes = null
      
      if (takeover) {
        // ÜBERNAHME HAT VORRANG!
        console.log(`   ✨ Übernahme gefunden für ${dateStr}`)
        startTime = takeover.start_time
        endTime = takeover.end_time
        isTakeover = true
        takeoverNotes = takeover.notes || 'Frühzeitige Übernahme'
      } else if (isHoliday) {
        // Feiertag = Sonntag-Zeiten
        startTime = company.sunday_start
        endTime = company.sunday_end
      } else {
        // Normale Wochentag-Zeiten
        switch (dayOfWeek) {
          case 1: startTime = company.monday_start; endTime = company.monday_end; break
          case 2: startTime = company.tuesday_start; endTime = company.tuesday_end; break
          case 3: startTime = company.wednesday_start; endTime = company.wednesday_end; break
          case 4: startTime = company.thursday_start; endTime = company.thursday_end; break
          case 5: startTime = company.friday_start; endTime = company.friday_end; break
          case 6: startTime = company.saturday_start; endTime = company.saturday_end; break
          case 0: startTime = company.sunday_start; endTime = company.sunday_end; break
        }
      }
      
      // Nur Tage mit Übernahmezeiten hinzufügen
      if (startTime && endTime) {
        const [startH, startM] = startTime.split(':').map(Number)
        const [endH, endM] = endTime.split(':').map(Number)
        
        let startMinutes = startH * 60 + startM
        let endMinutes = endH * 60 + endM
        
        // Über-Mitternacht-Fix
        if (endMinutes < startMinutes) {
          endMinutes += 24 * 60
        }
        
        const workMinutes = endMinutes - startMinutes
        const hours = workMinutes / 60
        
        const day = currentDate.getDate()
        const month = currentDate.getMonth() + 1
        const yearNum = currentDate.getFullYear()
        
        entries.push({
          date: `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${yearNum}`,
          weekday: weekdayName,
          start_time: startTime,
          end_time: endTime,
          hours: hours,
          is_holiday: isHoliday && !isTakeover, // Nur Feiertag wenn NICHT Übernahme
          is_takeover: isTakeover,
          holiday_name: isHoliday && !isTakeover ? holidayMap.get(dateStr) : undefined,
          takeover_notes: isTakeover ? takeoverNotes : undefined
        })
        
        totalHours += hours
      }
      
      // Nächster Tag
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    console.log(`✅ Generiere PDF mit ${entries.length} Einträgen`)
    console.log(`✅ Übernahmen im Report: ${entries.filter(e => e.is_takeover).length}`)
    
    // Zeitraum-Beschreibung erstellen
    const startDay = startDate.getDate()
    const startMonth = startDate.getMonth() + 1
    const startYear = startDate.getFullYear()
    const endDay = endDate.getDate()
    const endMonth = endDate.getMonth() + 1
    const endYear = endDate.getFullYear()
    
    const periodDescription = `${startDay.toString().padStart(2, '0')}.${startMonth.toString().padStart(2, '0')}.${startYear} - ${endDay.toString().padStart(2, '0')}.${endMonth.toString().padStart(2, '0')}.${endYear}`
    
    // PDF generieren
    const reportData = {
      company_name: company.name,
      period: periodDescription,
      year: startYear,
      entries: entries,
      total_hours: Math.round(totalHours),
      total_employees: 3.47,
      hourly_rate: 18.3
    }
    
    generateStundenreportPDF(reportData, res)
    
  } catch (error) {
    console.error('Error generating report:', error)
    res.status(500).json({ error: 'Fehler beim Generieren des Reports' })
  }
})

export default router
