import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth'
import { getHolidaysForState } from '../utils/postalCodeHelper'
import { generateInvoicePDF } from '../utils/invoicePdfGenerator'
import jwt from 'jsonwebtoken'

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

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoice_number: {
        startsWith: `RE-${year}-`
      }
    },
    orderBy: {
      invoice_number: 'desc'
    }
  })
  
  let nextNumber = 1
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoice_number.split('-')[2])
    nextNumber = lastNumber + 1
  }
  
  return `RE-${year}-${nextNumber.toString().padStart(4, '0')}`
}

router.post('/calculate-hours', authenticateToken, async (req, res) => {
  try {
    const { company_id, start_date, end_date } = req.body
    
    if (!company_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'Firma und Zeitraum erforderlich' })
    }
    
    console.log(`\n🔍 Berechne Stunden für Firma ${company_id} von ${start_date} bis ${end_date}`)
    
    const company = await prisma.company.findUnique({
      where: { id: parseInt(company_id) }
    })
    
    if (!company) {
      return res.status(404).json({ error: 'Firma nicht gefunden' })
    }
    
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)
    const year = startDate.getFullYear()
    
    const holidays = company.federal_state 
      ? getHolidaysForState(company.federal_state, year)
      : []
    
    const holidayDates = new Set(holidays.map(h => h.date))
    
    const takeovers = await prisma.earlyTakeover.findMany({
      where: {
        company_id: parseInt(company_id),
        start_date: { lte: endDate },
        end_date: { gte: startDate }
      }
    })
    
    console.log(`✅ Gefundene Übernahmen: ${takeovers.length}`)
    
    let totalHours = 0
    let regularHours = 0
    let takeoverHours = 0
    let holidayHours = 0
    
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const dayOfWeek = currentDate.getDay()
      
      const isHoliday = holidayDates.has(dateStr)
      
      const takeover = takeovers.find(t => {
        const tStart = new Date(t.start_date).toISOString().split('T')[0]
        const tEnd = new Date(t.end_date).toISOString().split('T')[0]
        return dateStr >= tStart && dateStr <= tEnd
      })
      
      let startTime = null
      let endTime = null
      let dayType = 'regular'
      
      if (takeover) {
        startTime = takeover.start_time
        endTime = takeover.end_time
        dayType = 'takeover'
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
        dayType = 'holiday'
      } else {
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
        
        const hours = workMinutes / 60
        
        totalHours += hours
        
        if (dayType === 'takeover') {
          takeoverHours += hours
        } else if (dayType === 'holiday') {
          holidayHours += hours
        } else {
          regularHours += hours
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    console.log(`📊 GESAMT: ${totalHours.toFixed(2)} Stunden`)
    
    res.json({
      total_hours: Math.round(totalHours * 100) / 100,
      regular_hours: Math.round(regularHours * 100) / 100,
      takeover_hours: Math.round(takeoverHours * 100) / 100,
      holiday_hours: Math.round(holidayHours * 100) / 100,
      company_name: company.name
    })
    
  } catch (error) {
    console.error('❌ Error calculating hours:', error)
    res.status(500).json({ error: 'Fehler beim Berechnen der Stunden' })
  }
})

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, company_id } = req.query
    
    const where: any = {}
    
    // Handle status filtering - support 'all', single status, or multiple statuses
    if (status && status !== 'all') {
      if (status === 'open') {
        // Include both 'open' and 'partial' for open invoices
        where.status = { in: ['open', 'partial'] }
      } else {
        where.status = status
      }
    }
    
    if (company_id) where.company_id = parseInt(company_id as string)
    
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            city: true,
            customer_number: true
          }
        },
        payments: true
      },
      orderBy: {
        invoice_date: 'desc'
      }
    })
    
    res.json(invoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    res.status(500).json({ error: 'Fehler beim Abrufen der Rechnungen' })
  }
})

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: {
        company: true,
        payments: true
      }
    })
    
    if (!invoice) {
      return res.status(404).json({ error: 'Rechnung nicht gefunden' })
    }
    
    res.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    res.status(500).json({ error: 'Fehler beim Abrufen der Rechnung' })
  }
})

// PDF herunterladen - MIT KUNDENNUMMER!
router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params
    
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token as string
    
    if (!token) {
      return res.status(401).json({ error: 'Kein Token vorhanden' })
    }
    
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    } catch (err) {
      return res.status(401).json({ error: 'Ungültiges Token' })
    }
    
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: {
        company: true
      }
    })
    
    if (!invoice) {
      return res.status(404).json({ error: 'Rechnung nicht gefunden' })
    }
    
    const pdfData = {
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
      takeover_hours: invoice.takeover_hours || undefined,
      takeover_rate: invoice.takeover_rate || undefined,
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
    
    generateInvoicePDF(pdfData, res)
    
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    res.status(500).json({ error: 'Fehler beim Generieren des PDFs' })
  }
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = req.body
    const username = (req as any).user?.username || 'system'
    
    console.log('📥 Erstelle Rechnung:', JSON.stringify(data, null, 2))
    
    const invoiceNumber = await generateInvoiceNumber()
    
    // Look up company for early_takeover_price if takeover_hours are provided
    let takeoverRate: number | null = null
    if (data.takeover_hours && data.takeover_hours > 0) {
      const company = await prisma.company.findUnique({
        where: { id: data.company_id }
      })
      takeoverRate = company?.early_takeover_price ?? null
    }
    
    let subtotal = 0

    if (data.billing_type === 'hourly') {
      // Stundenabrechnung
      subtotal = (data.total_hours || 0) * (data.hourly_rate || 0)
    } else if (data.billing_type === 'per_job') {
      // Auftragsabrechnung: Service-Pauschale + Aufträge
      subtotal = (data.service_fee || 0) +
        (data.count_pkw || 0) * (data.price_pkw || 0) +
        (data.count_lkw || 0) * (data.price_lkw || 0) +
        (data.count_oilspill || 0) * (data.price_oilspill || 0)
    } else if (data.billing_type === 'flat_rate') {
      // Pauschale
      subtotal = data.monthly_rate || 0
    }
    
    // Add takeover hours to subtotal if applicable
    if (data.takeover_hours && data.takeover_hours > 0 && takeoverRate) {
      subtotal += data.takeover_hours * takeoverRate
    }

    const taxRate = data.tax_rate || 19
    const taxAmount = (subtotal * taxRate) / 100
    const totalAmount = subtotal + taxAmount
    
    const invoice = await prisma.invoice.create({
      data: {
        invoice_number: invoiceNumber,
        company_id: data.company_id,
        invoice_date: new Date(data.invoice_date),
        due_date: new Date(data.due_date),
        period_start: new Date(data.period_start),
        period_end: new Date(data.period_end),
        billing_type: data.billing_type,
        total_hours: data.total_hours || null,
        hourly_rate: data.hourly_rate || null,
        takeover_hours: data.takeover_hours || null,
        takeover_rate: takeoverRate,
        count_pkw: data.count_pkw || null,
        count_lkw: data.count_lkw || null,
        count_oilspill: data.count_oilspill || null,
        price_pkw: data.price_pkw || null,
        price_lkw: data.price_lkw || null,
        price_oilspill: data.price_oilspill || null,
        service_fee: data.service_fee || null,
        monthly_rate: data.monthly_rate || null,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'open',
        notes: data.notes || null,
        created_by: username
      },
      include: {
        company: true
      }
    })
    
    console.log('✅ Rechnung erstellt:', invoice.invoice_number)
    
    res.json(invoice)
  } catch (error) {
    console.error('❌ Error creating invoice:', error)
    res.status(500).json({ error: 'Fehler beim Erstellen der Rechnung' })
  }
})

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body
    
    const invoice = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: {
        status: data.status,
        paid_date: data.paid_date ? new Date(data.paid_date) : null,
        notes: data.notes
      },
      include: {
        company: true,
        payments: true
      }
    })
    
    res.json(invoice)
  } catch (error) {
    console.error('Error updating invoice:', error)
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Rechnung' })
  }
})

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const invoiceId = parseInt(id)
    
    // First, delete all associated Payment records to ensure referential integrity
    await prisma.payment.deleteMany({
      where: { invoice_id: invoiceId }
    })
    
    // Then delete the invoice itself
    await prisma.invoice.delete({
      where: { id: invoiceId }
    })
    
    res.json({ message: 'Rechnung gelöscht' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    res.status(500).json({ error: 'Fehler beim Löschen der Rechnung' })
  }
})

// POST /:id/payments - Record a new payment for an invoice
router.post('/:id/payments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { amount, payment_date, payment_method, notes } = req.body
    const username = (req as any).user?.username || 'system'
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Betrag muss größer als 0 sein' })
    }
    
    // Get the invoice to check current status and total amount
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: {
        payments: true
      }
    })
    
    if (!invoice) {
      return res.status(404).json({ error: 'Rechnung nicht gefunden' })
    }
    
    // Calculate total paid including this new payment
    const currentTotalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
    const newTotalPaid = currentTotalPaid + amount
    
    // Validate payment doesn't exceed total amount
    if (newTotalPaid > invoice.total_amount) {
      return res.status(400).json({ 
        error: 'Zahlungsbetrag überschreitet den offenen Rechnungsbetrag',
        open_amount: invoice.total_amount - currentTotalPaid
      })
    }
    
    // Create the payment record
    const payment = await prisma.payment.create({
      data: {
        invoice_id: parseInt(id),
        amount,
        payment_date: payment_date ? new Date(payment_date) : new Date(),
        payment_method: payment_method || null,
        notes: notes || null,
        created_by: username
      }
    })
    
    // Determine new status based on total paid
    let newStatus = invoice.status
    if (newTotalPaid >= invoice.total_amount) {
      newStatus = 'paid'
    } else if (newTotalPaid > 0) {
      newStatus = 'partial'
    }
    
    // Update invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: {
        status: newStatus,
        paid_date: newStatus === 'paid' ? new Date() : null
      },
      include: {
        company: true,
        payments: true
      }
    })
    
    console.log(`✅ Zahlung gebucht: ${amount}€ für Rechnung ${invoice.invoice_number}. Status: ${newStatus}`)
    
    res.json({
      payment,
      invoice: updatedInvoice,
      total_paid: newTotalPaid
    })
    
  } catch (error) {
    console.error('❌ Error recording payment:', error)
    res.status(500).json({ error: 'Fehler beim Buchen der Zahlung' })
  }
})

export default router
