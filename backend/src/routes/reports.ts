import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth'
import { generateStundenreportPDF } from '../utils/pdfGenerator'
import { getHolidaysForState } from '../utils/postalCodeHelper'

const router = Router()
const prisma = new PrismaClient()

const MINUTES_PER_DAY = 24 * 60

// Helper function to safely access company schedule fields
function getCompanySchedule(company: any, day: string): { start: string | null, end: string | null } {
  const startField = `${day}_start`
  const endField = `${day}_end`
  return {
    start: company[startField] || null,
    end: company[endField] || null
  }
}

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
    
    // Fetch HoursCompensation entries for the report period and company
    const compensations = await prisma.hoursCompensation.findMany({
      where: {
        company_id: parseInt(company_id),
        start_date: { lte: endDate },
        end_date: { gte: startDate }
      }
    })
    
    console.log(`✅ Gefundene Stundenausgleiche für Report: ${compensations.length}`)
    compensations.forEach(c => {
      console.log(`   - ${c.start_date} bis ${c.end_date}: ${c.total_hours} Stunden`)
    })
    
    // Build a map of date -> compensation hours to add (sum of all applicable compensations)
    const compensationHoursMap = new Map<string, number>()
    
    for (const comp of compensations) {
      const compStart = new Date(comp.start_date)
      const compEnd = new Date(comp.end_date)
      
      // Calculate the number of days in this compensation period using UTC to avoid DST issues
      const startUtc = Date.UTC(compStart.getFullYear(), compStart.getMonth(), compStart.getDate())
      const endUtc = Date.UTC(compEnd.getFullYear(), compEnd.getMonth(), compEnd.getDate())
      const daysCount = Math.floor((endUtc - startUtc) / (1000 * 60 * 60 * 24)) + 1
      
      // Ensure we have at least 1 day and valid hours
      if (daysCount >= 1 && comp.total_hours > 0) {
        // NEW LOGIC: Distribute hours in "clean" increments (prefer whole hours, then 0.5 steps)
        // Build list of dates in the compensation period
        const dates: string[] = []
        const compDate = new Date(compStart)
        while (compDate <= compEnd) {
          dates.push(compDate.toISOString().split('T')[0])
          compDate.setDate(compDate.getDate() + 1)
        }
        
        // First try with whole hours (floor to nearest 1.0)
        const baseHoursPerDayWhole = Math.floor(comp.total_hours / daysCount)
        const baseTotalWhole = baseHoursPerDayWhole * daysCount
        const remainingHoursWhole = comp.total_hours - baseTotalWhole
        
        // If remainder can be distributed as whole hours (remainder is a whole number), do so
        if (remainingHoursWhole === Math.floor(remainingHoursWhole) && remainingHoursWhole <= daysCount) {
          let remaining = remainingHoursWhole
          for (const dateStr of dates) {
            let dailyHours = baseHoursPerDayWhole
            if (remaining >= 1) {
              dailyHours += 1
              remaining -= 1
            }
            const existing = compensationHoursMap.get(dateStr) || 0
            compensationHoursMap.set(dateStr, existing + dailyHours)
          }
        } else {
          // Otherwise use 0.5-step distribution
          // Round down to nearest 0.5 by multiplying by 2, flooring, then dividing by 2
          const baseHoursPerDay = Math.floor((comp.total_hours / daysCount) * 2) / 2
          const baseTotal = baseHoursPerDay * daysCount
          // Use rounding to avoid floating-point precision issues
          let remainingHours = Math.round((comp.total_hours - baseTotal) * 2) / 2
          
          for (const dateStr of dates) {
            let dailyHours = baseHoursPerDay
            if (remainingHours >= 0.5) {
              dailyHours += 0.5
              remainingHours -= 0.5
            }
            const existing = compensationHoursMap.get(dateStr) || 0
            compensationHoursMap.set(dateStr, existing + dailyHours)
          }
        }
      }
    }
    
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
        // Holiday logic: check holiday_takeover setting
        if (company.holiday_takeover === false) {
          // Skip this day - no hours
          startTime = null
          endTime = null
        } else {
          // Use schedule from holiday_schedule_ref
          const refDay = company.holiday_schedule_ref || 'sunday'
          const schedule = getCompanySchedule(company, refDay)
          startTime = schedule.start
          endTime = schedule.end
        }
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
        
        // 24h shift logic: if start and end times are equal, it's a full 24-hour shift
        let workMinutes
        if (startTime === endTime) {
          workMinutes = MINUTES_PER_DAY  // 1440 minutes = 24 hours
        } else if (endMinutes < startMinutes) {
          // Overnight shift (e.g., 22:00 to 06:00)
          endMinutes += MINUTES_PER_DAY
          workMinutes = endMinutes - startMinutes
        } else {
          workMinutes = endMinutes - startMinutes
        }
        
        let hours = workMinutes / 60
        
        // Add compensation hours if applicable for this day
        const compensationHours = compensationHoursMap.get(dateStr) || 0
        if (compensationHours > 0) {
          console.log(`   ✅ Stundenausgleich für ${dateStr}: +${compensationHours.toFixed(2)} Stunden`)
          hours += compensationHours
        }
        
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
