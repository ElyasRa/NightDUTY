import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth'
import { sendEmail } from '../services/emailService'
import { generateInvoicePDFBuffer } from '../utils/invoicePdfGenerator'
import { generateStundenreportPDFBuffer } from '../utils/pdfGenerator'
import { getHolidaysForState } from '../utils/postalCodeHelper'

const router = Router()
const prisma = new PrismaClient()

// POST /api/email/send-invoice - Send invoice via email with attachments
router.post('/send-invoice', authenticateToken, async (req, res) => {
  try {
    const { invoiceId, subject, body, recipientEmail, attachHoursReport, reportStartDate, reportEndDate } = req.body
    
    if (!invoiceId || !subject || !body) {
      return res.status(400).json({ error: 'invoiceId, subject und body sind erforderlich' })
    }
    
    // Fetch the invoice with company details
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(invoiceId) },
      include: {
        company: true
      }
    })
    
    if (!invoice) {
      return res.status(404).json({ error: 'Rechnung nicht gefunden' })
    }
    
    // Use provided recipientEmail or fall back to company email
    const emailTo = recipientEmail || invoice.company.email
    
    if (!emailTo) {
      return res.status(400).json({ error: 'Keine E-Mail-Adresse angegeben' })
    }
    
    console.log(`📧 Sende Rechnung ${invoice.invoice_number} an ${emailTo}`)
    
    // Generate invoice PDF as buffer
    const invoicePdfData = {
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date.toISOString(),
      due_date: invoice.due_date.toISOString(),
      period_start: invoice.period_start.toISOString(),
      period_end: invoice.period_end.toISOString(),
      company: {
        name: invoice.company.name,
        customer_number: invoice.company.customer_number || undefined,
        contact_person: invoice.company.contact_person || undefined,
        address: invoice.company.address || undefined,
        postal_code: invoice.company.postal_code || undefined,
        city: invoice.company.city || undefined,
        email: invoice.company.email || undefined,
        phone: invoice.company.phone || undefined
      },
      billing_type: invoice.billing_type,
      total_hours: invoice.total_hours || undefined,
      hourly_rate: invoice.hourly_rate || undefined,
      count_pkw: invoice.count_pkw || undefined,
      count_lkw: invoice.count_lkw || undefined,
      count_oilspill: invoice.count_oilspill || undefined,
      price_pkw: invoice.price_pkw || undefined,
      price_lkw: invoice.price_lkw || undefined,
      price_oilspill: invoice.price_oilspill || undefined,
      service_fee: invoice.service_fee || undefined,
      monthly_rate: invoice.monthly_rate || undefined,
      subtotal: invoice.subtotal,
      tax_rate: invoice.tax_rate,
      tax_amount: invoice.tax_amount,
      total_amount: invoice.total_amount,
      notes: invoice.notes || undefined
    }
    
    const invoicePdfBuffer = await generateInvoicePDFBuffer(invoicePdfData)
    console.log('✅ Invoice PDF generated')
    
    // Build attachments array - always include invoice
    const attachments: Array<{ filename: string; content: Buffer }> = [
      {
        filename: `Rechnung_${invoice.invoice_number}.pdf`,
        content: invoicePdfBuffer
      }
    ]
    
    // Only generate and attach Stundenreport if attachHoursReport is true (default to true for backward compatibility)
    const shouldAttachHoursReport = attachHoursReport === undefined ? true : Boolean(attachHoursReport)
    
    if (shouldAttachHoursReport) {
      // Generate Stundenreport PDF as buffer
      // Use custom dates if provided, otherwise fall back to invoice period
      const startDate = reportStartDate ? new Date(reportStartDate) : new Date(invoice.period_start)
      const endDate = reportEndDate ? new Date(reportEndDate) : new Date(invoice.period_end)
      const year = startDate.getFullYear()
    
      const holidays = invoice.company.federal_state 
        ? getHolidaysForState(invoice.company.federal_state, year)
        : []
      
      const holidayDates = new Set(holidays.map(h => h.date))
      const holidayMap = new Map(holidays.map(h => [h.date, h.name]))
      
      // Get takeovers for the period
      const takeovers = await prisma.earlyTakeover.findMany({
        where: {
          company_id: invoice.company_id,
          start_date: { lte: endDate },
          end_date: { gte: startDate }
        }
      })
      
      console.log(`✅ Found ${takeovers.length} takeovers for report`)
      
      // Generate all entries for the period
      const entries = []
      let totalHours = 0
      
      const currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const dayOfWeek = currentDate.getDay()
        
        const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
        const weekdayName = weekdays[dayOfWeek]
        
        const isHoliday = holidayDates.has(dateStr)
        
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
          startTime = takeover.start_time
          endTime = takeover.end_time
          isTakeover = true
          takeoverNotes = takeover.notes || 'Frühzeitige Übernahme'
        } else if (isHoliday) {
          startTime = invoice.company.sunday_start
          endTime = invoice.company.sunday_end
        } else {
          switch (dayOfWeek) {
            case 1: startTime = invoice.company.monday_start; endTime = invoice.company.monday_end; break
            case 2: startTime = invoice.company.tuesday_start; endTime = invoice.company.tuesday_end; break
            case 3: startTime = invoice.company.wednesday_start; endTime = invoice.company.wednesday_end; break
            case 4: startTime = invoice.company.thursday_start; endTime = invoice.company.thursday_end; break
            case 5: startTime = invoice.company.friday_start; endTime = invoice.company.friday_end; break
            case 6: startTime = invoice.company.saturday_start; endTime = invoice.company.saturday_end; break
            case 0: startTime = invoice.company.sunday_start; endTime = invoice.company.sunday_end; break
          }
        }
        
        if (startTime && endTime) {
          const [startH, startM] = startTime.split(':').map(Number)
          const [endH, endM] = endTime.split(':').map(Number)
          
          let startMinutes = startH * 60 + startM
          let endMinutes = endH * 60 + endM
          
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
            is_holiday: isHoliday && !isTakeover,
            is_takeover: isTakeover,
            holiday_name: isHoliday && !isTakeover ? holidayMap.get(dateStr) : undefined,
            takeover_notes: isTakeover ? takeoverNotes : undefined
          })
          
          totalHours += hours
        }
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      const startDay = startDate.getDate()
      const startMonth = startDate.getMonth() + 1
      const startYear = startDate.getFullYear()
      const endDay = endDate.getDate()
      const endMonth = endDate.getMonth() + 1
      const endYear = endDate.getFullYear()
      
      const periodDescription = `${startDay.toString().padStart(2, '0')}.${startMonth.toString().padStart(2, '0')}.${startYear} - ${endDay.toString().padStart(2, '0')}.${endMonth.toString().padStart(2, '0')}.${endYear}`
      
      // Use company hourly rate if available, otherwise use a default
      const hourlyRate = invoice.hourly_rate || invoice.company.hourly_rate || 18.3
      
      const reportData = {
        company_name: invoice.company.name,
        period: periodDescription,
        year: startYear,
        entries: entries,
        total_hours: Math.round(totalHours),
        total_employees: 3.47,
        hourly_rate: hourlyRate
      }
      
      const stundenreportPdfBuffer = await generateStundenreportPDFBuffer(reportData)
      console.log('✅ Stundenreport PDF generated')
      
      attachments.push({
        filename: `Stundenreport_${invoice.company.name.replace(/\s+/g, '_')}.pdf`,
        content: stundenreportPdfBuffer
      })
    }
    
    // Send email with attachments
    await sendEmail({
      to: emailTo,
      subject,
      body,
      attachments
    })
    
    console.log('✅ Email sent successfully')
    
    res.json({ 
      success: true, 
      message: `E-Mail erfolgreich an ${emailTo} gesendet` 
    })
    
  } catch (error) {
    console.error('❌ Error sending email:', error)
    res.status(500).json({ 
      error: 'Fehler beim Senden der E-Mail',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
