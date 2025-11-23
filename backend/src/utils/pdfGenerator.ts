import PDFDocument from 'pdfkit'
import { Response } from 'express'
import * as fs from 'fs'
import * as path from 'path'

interface TimeEntry {
  date: string
  weekday: string
  start_time: string
  end_time: string
  hours: number
  is_holiday: boolean
  is_takeover: boolean
  holiday_name?: string
  takeover_notes?: string
}

interface ReportData {
  company_name: string
  period: string
  year: number
  entries: TimeEntry[]
  total_hours: number
  total_employees: number
  hourly_rate: number
}

export function generateStundenreportPDF(data: ReportData, res: Response) {
  const doc = new PDFDocument({ 
    margin: 45, 
    size: 'A4',
    bufferPages: true
  })
  
  const filename = `Stundenreport_${data.company_name.replace(/\s+/g, '_')}.pdf`
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
  
  doc.pipe(res)
  
  let yPos = 20
  
  // ==================== LOGO ====================
  
  const logoPath = path.join(__dirname, '../../public/images/logo.png')
  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 200, yPos, { width: 200 })
      yPos += 100
    } catch (err) {
      doc.fontSize(42).font('Helvetica-Bold')
      const colors = ['#e74c3c', '#e67e22', '#f39c12', '#27ae60', '#3498db', '#8e44ad', '#e91e63']
      const letters = ['N', 'I', 'G', 'H', 'T', 'D', 'U', 'T', 'Y']
      let xPos = 180
      
      letters.forEach((letter, idx) => {
        doc.fillColor(colors[idx]).text(letter, xPos, yPos, { continued: idx < letters.length - 1 })
        xPos += letter === 'I' ? 15 : 30
      })
      yPos += 80
    }
  } else {
    doc.fontSize(42).font('Helvetica-Bold')
    const colors = ['#e74c3c', '#e67e22', '#f39c12', '#27ae60', '#3498db', '#8e44ad', '#e91e63']
    const letters = ['N', 'I', 'G', 'H', 'T', 'D', 'U', 'T', 'Y']
    let xPos = 180
    
    letters.forEach((letter, idx) => {
      doc.fillColor(colors[idx]).text(letter, xPos, yPos, { continued: idx < letters.length - 1 })
      xPos += letter === 'I' ? 15 : 30
    })
    yPos += 80
  }
  
  // Firmenname
  doc.font('Helvetica-Bold').fontSize(22).fillColor('#2c3e50')
  doc.text(data.company_name, 45, yPos, { align: 'center', width: 505 })
  yPos += 28
  
  // ==================== TABELLE ====================
  
  const tableX = 45
  const tableWidth = 505
  const colWidths = [70, 85, 55, 55, 60, 180]
  const headers = ['Datum', 'Wochentag', 'Beginn', 'Ende', 'Stunden', 'Feiertag']
  
  // Header
  doc.rect(tableX, yPos, tableWidth, 20).fillAndStroke('#2c3e50', '#2c3e50')
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff')
  
  let xPos = tableX + 6
  headers.forEach((header, i) => {
    doc.text(header, xPos, yPos + 5.5, { 
      width: colWidths[i] - 8, 
      align: i === 4 ? 'center' : 'left' 
    })
    xPos += colWidths[i]
  })
  
  yPos += 20
  
  // Zeilen
  const rowHeight = 12.5
  doc.font('Helvetica').fontSize(9.5)
  
  data.entries.forEach((entry, index) => {
    let bgColor = '#ffffff'
    let borderColor = '#dee2e6'
    let textColor = '#2c3e50'
    
    // WICHTIG: Übernahmen in GELB, Feiertage in ROT!
    if (entry.is_takeover) {
      bgColor = '#fef3c7'  // GELB für Übernahmen
      borderColor = '#fbbf24'
      textColor = '#92400e'
    } else if (entry.is_holiday) {
      bgColor = '#ffe6e6'  // ROT für Feiertage
      borderColor = '#ffcccc'
      textColor = '#e74c3c'
    } else if (index % 2 === 1) {
      bgColor = '#f8f9fa'
    }
    
    doc.rect(tableX, yPos, tableWidth, rowHeight).fillAndStroke(bgColor, borderColor)
    doc.fillColor(textColor)
    
    xPos = tableX + 6
    const values = [
      entry.date,
      entry.weekday,
      entry.start_time,
      entry.end_time,
      entry.hours.toString(),
      entry.is_takeover ? (entry.takeover_notes || 'Frühzeitige Übernahme') : (entry.holiday_name || '')
    ]
    
    values.forEach((val, i) => {
      doc.text(val, xPos, yPos + 3, { 
        width: colWidths[i] - 8, 
        align: i === 4 ? 'center' : 'left',
        lineBreak: false 
      })
      xPos += colWidths[i]
    })
    
    yPos += rowHeight
  })
  
  doc.strokeColor('#2c3e50').lineWidth(1.5).moveTo(tableX, yPos).lineTo(tableX + tableWidth, yPos).stroke()
  yPos += 4
  
  // ==================== GESAMTSUMME ====================
  
  doc.rect(tableX, yPos, tableWidth, 28).fillAndStroke('#34495e', '#34495e')
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#ffffff')
  doc.text('Gesamtstundenleistung:', tableX + 10, yPos + 8)
  doc.fontSize(16).text(`${data.total_hours} Stunden`, tableX + 350, yPos + 6, { align: 'right', width: 140 })
  
  yPos += 34
  
  // ==================== MITARBEITER ====================
  
  doc.font('Helvetica').fontSize(9.5).fillColor('#5a6c7d')
  doc.text(
    'Für unsere geleisteten Gesamtstunden würden Sie ohne Urlaub/Krankheit',
    45, yPos, { align: 'center', width: 505 }
  )
  doc.text(
    'folgende Mitarbeiterzahl in diesem Monat benötigen:',
    45, yPos + 12, { align: 'center', width: 505 }
  )
  
  yPos += 28
  
  const employeesNeeded = (data.total_hours / 160).toFixed(2)
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#2c3e50')
  doc.text(
    `${employeesNeeded} Mitarbeiter (160 Std./Monat)`,
    45, yPos, { align: 'center', width: 505 }
  )
  
  yPos += 26
  
  // ==================== KOSTEN ====================
  
  const boxWidth = 460
  const boxX = (595.28 - boxWidth) / 2
  
  doc.rect(boxX, yPos, boxWidth, 42).fillAndStroke('#e74c3c', '#e74c3c')
  
  const totalCost = data.total_hours * data.hourly_rate
  doc.font('Helvetica-Bold').fontSize(30).fillColor('#ffffff')
  doc.text(
    `${totalCost.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
    boxX, yPos + 8, { align: 'center', width: boxWidth }
  )
  
  yPos += 50
  
  // ==================== FOOTER ====================
  
  doc.font('Helvetica').fontSize(9).fillColor('#6c757d')
  doc.text(
    'Ihre Lohnkosten für 3 Vollzeit-Disponenten (inkl. Arbeitgeberanteil ca. 21%)',
    45, yPos, { align: 'center', width: 505 }
  )
  
  yPos += 12
  
  doc.text(
    'liegen in diesem Monat voraussichtlich bei diesem Betrag.',
    45, yPos, { align: 'center', width: 505 }
  )
  
  yPos += 18
  
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#868e96')
  doc.text(
    'Urlaub und Krankheit sind unberücksichtigt.',
    45, yPos, { align: 'center', width: 505 }
  )
  
  doc.end()
}

export function generateStundenreportPDFBuffer(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      margin: 45, 
      size: 'A4',
      bufferPages: true
    })
    
    const chunks: Buffer[] = []
    
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    
    let yPos = 20
    
    // ==================== LOGO ====================
    
    const logoPath = path.join(__dirname, '../../public/images/logo.png')
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, 200, yPos, { width: 200 })
        yPos += 100
      } catch (err) {
        doc.fontSize(42).font('Helvetica-Bold')
        const colors = ['#e74c3c', '#e67e22', '#f39c12', '#27ae60', '#3498db', '#8e44ad', '#e91e63']
        const letters = ['N', 'I', 'G', 'H', 'T', 'D', 'U', 'T', 'Y']
        let xPos = 180
        
        letters.forEach((letter, idx) => {
          doc.fillColor(colors[idx]).text(letter, xPos, yPos, { continued: idx < letters.length - 1 })
          xPos += letter === 'I' ? 15 : 30
        })
        yPos += 80
      }
    } else {
      doc.fontSize(42).font('Helvetica-Bold')
      const colors = ['#e74c3c', '#e67e22', '#f39c12', '#27ae60', '#3498db', '#8e44ad', '#e91e63']
      const letters = ['N', 'I', 'G', 'H', 'T', 'D', 'U', 'T', 'Y']
      let xPos = 180
      
      letters.forEach((letter, idx) => {
        doc.fillColor(colors[idx]).text(letter, xPos, yPos, { continued: idx < letters.length - 1 })
        xPos += letter === 'I' ? 15 : 30
      })
      yPos += 80
    }
    
    // Firmenname
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#2c3e50')
    doc.text(data.company_name, 45, yPos, { align: 'center', width: 505 })
    yPos += 28
    
    // ==================== TABELLE ====================
    
    const tableX = 45
    const tableWidth = 505
    const colWidths = [70, 85, 55, 55, 60, 180]
    const headers = ['Datum', 'Wochentag', 'Beginn', 'Ende', 'Stunden', 'Feiertag']
    
    // Header
    doc.rect(tableX, yPos, tableWidth, 20).fillAndStroke('#2c3e50', '#2c3e50')
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff')
    
    let xPos = tableX + 6
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos + 5.5, { 
        width: colWidths[i] - 8, 
        align: i === 4 ? 'center' : 'left' 
      })
      xPos += colWidths[i]
    })
    
    yPos += 20
    
    // Zeilen
    const rowHeight = 12.5
    doc.font('Helvetica').fontSize(9.5)
    
    data.entries.forEach((entry, index) => {
      let bgColor = '#ffffff'
      let borderColor = '#dee2e6'
      let textColor = '#2c3e50'
      
      // WICHTIG: Übernahmen in GELB, Feiertage in ROT!
      if (entry.is_takeover) {
        bgColor = '#fef3c7'  // GELB für Übernahmen
        borderColor = '#fbbf24'
        textColor = '#92400e'
      } else if (entry.is_holiday) {
        bgColor = '#ffe6e6'  // ROT für Feiertage
        borderColor = '#ffcccc'
        textColor = '#e74c3c'
      } else if (index % 2 === 1) {
        bgColor = '#f8f9fa'
      }
      
      doc.rect(tableX, yPos, tableWidth, rowHeight).fillAndStroke(bgColor, borderColor)
      doc.fillColor(textColor)
      
      xPos = tableX + 6
      const values = [
        entry.date,
        entry.weekday,
        entry.start_time,
        entry.end_time,
        entry.hours.toString(),
        entry.is_takeover ? (entry.takeover_notes || 'Frühzeitige Übernahme') : (entry.holiday_name || '')
      ]
      
      values.forEach((val, i) => {
        doc.text(val, xPos, yPos + 3, { 
          width: colWidths[i] - 8, 
          align: i === 4 ? 'center' : 'left',
          lineBreak: false 
        })
        xPos += colWidths[i]
      })
      
      yPos += rowHeight
    })
    
    doc.strokeColor('#2c3e50').lineWidth(1.5).moveTo(tableX, yPos).lineTo(tableX + tableWidth, yPos).stroke()
    yPos += 4
    
    // ==================== GESAMTSUMME ====================
    
    doc.rect(tableX, yPos, tableWidth, 28).fillAndStroke('#34495e', '#34495e')
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#ffffff')
    doc.text('Gesamtstundenleistung:', tableX + 10, yPos + 8)
    doc.fontSize(16).text(`${data.total_hours} Stunden`, tableX + 350, yPos + 6, { align: 'right', width: 140 })
    
    yPos += 34
    
    // ==================== MITARBEITER ====================
    
    doc.font('Helvetica').fontSize(9.5).fillColor('#5a6c7d')
    doc.text(
      'Für unsere geleisteten Gesamtstunden würden Sie ohne Urlaub/Krankheit',
      45, yPos, { align: 'center', width: 505 }
    )
    doc.text(
      'folgende Mitarbeiterzahl in diesem Monat benötigen:',
      45, yPos + 12, { align: 'center', width: 505 }
    )
    
    yPos += 28
    
    const employeesNeeded = (data.total_hours / 160).toFixed(2)
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#2c3e50')
    doc.text(
      `${employeesNeeded} Mitarbeiter (160 Std./Monat)`,
      45, yPos, { align: 'center', width: 505 }
    )
    
    yPos += 26
    
    // ==================== KOSTEN ====================
    
    const boxWidth = 460
    const boxX = (595.28 - boxWidth) / 2
    
    doc.rect(boxX, yPos, boxWidth, 42).fillAndStroke('#e74c3c', '#e74c3c')
    
    const totalCost = data.total_hours * data.hourly_rate
    doc.font('Helvetica-Bold').fontSize(30).fillColor('#ffffff')
    doc.text(
      `${totalCost.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
      boxX, yPos + 8, { align: 'center', width: boxWidth }
    )
    
    yPos += 50
    
    // ==================== FOOTER ====================
    
    doc.font('Helvetica').fontSize(9).fillColor('#6c757d')
    doc.text(
      'Ihre Lohnkosten für 3 Vollzeit-Disponenten (inkl. Arbeitgeberanteil ca. 21%)',
      45, yPos, { align: 'center', width: 505 }
    )
    
    yPos += 12
    
    doc.text(
      'liegen in diesem Monat voraussichtlich bei diesem Betrag.',
      45, yPos, { align: 'center', width: 505 }
    )
    
    yPos += 18
    
    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#868e96')
    doc.text(
      'Urlaub und Krankheit sind unberücksichtigt.',
      45, yPos, { align: 'center', width: 505 }
    )
    
    doc.end()
  })
}
