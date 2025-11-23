import nodemailer, { SendMailOptions } from 'nodemailer'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface EmailAttachment {
  filename: string
  content: Buffer
}

export interface EmailOptions {
  to: string
  subject: string
  body: string
  attachments?: EmailAttachment[]
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  // Get SMTP settings from database
  const settings = await prisma.systemSettings.findFirst({
    orderBy: {
      id: 'desc'
    }
  })
  
  if (!settings || !settings.smtp_host || !settings.smtp_port || !settings.smtp_user || !settings.smtp_password || !settings.smtp_from_address) {
    throw new Error('SMTP-Einstellungen sind nicht vollständig konfiguriert')
  }
  
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: settings.smtp_host,
    port: settings.smtp_port,
    secure: settings.smtp_port === 465, // true for 465, false for other ports
    auth: {
      user: settings.smtp_user,
      pass: settings.smtp_password
    }
  })
  
  // Prepare mail options
  const mailOptions: SendMailOptions = {
    from: settings.smtp_from_address,
    to: options.to,
    subject: options.subject,
    html: options.body.replace(/\n/g, '<br>')
  }
  
  // Add attachments if any
  if (options.attachments && options.attachments.length > 0) {
    mailOptions.attachments = options.attachments.map(att => ({
      filename: att.filename,
      content: att.content
    }))
  }
  
  // Send email
  await transporter.sendMail(mailOptions)
}

export async function testSmtpConnection(
  host: string,
  port: number,
  user: string,
  password: string
): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass: password
      }
    })
    
    await transporter.verify()
    return true
  } catch (error) {
    console.error('SMTP connection test failed:', error)
    return false
  }
}
