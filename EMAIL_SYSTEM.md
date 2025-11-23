# Email Dispatch and Settings System

This document describes the Email Dispatch and Settings system implemented in NightDUTY.

## Overview

The system allows administrators to:
1. Configure SMTP email settings
2. Define email templates for invoices and dunning notices
3. Send invoices via email with automatic PDF attachments

## Backend Components

### Database Schema
- **SystemSettings** model stores:
  - SMTP configuration (host, port, user, password, from address)
  - Email templates for invoices and dunning notices

### Services
- **emailService.ts**: Handles SMTP connection and email sending with attachments
  - `sendEmail()`: Sends emails with optional attachments
  - `testSmtpConnection()`: Tests SMTP configuration

### Routes

#### `/api/settings`
- `GET`: Retrieve system settings
- `POST`: Save system settings
- `POST /test-connection`: Test SMTP connection

#### `/api/email/send-invoice`
- `POST`: Send invoice email with attachments
  - Accepts: `invoiceId`, `subject`, `body`
  - Automatically attaches: Invoice PDF and Stundenreport PDF

### PDF Generation
Both `invoicePdfGenerator.ts` and `pdfGenerator.ts` now support:
- Direct response streaming (existing functionality)
- Buffer generation for email attachments (new functionality)

## Frontend Components

### EinstellungenView (Settings)
Location: `/einstellungen`

Features:
- SMTP server configuration form
- Test connection button
- Email template editor with placeholders:
  - Invoice template: `{{invoice_number}}`, `{{company_name}}`, `{{period}}`
  - Dunning template: `{{invoice_number}}`, `{{company_name}}`

### RechnungsversandView (Email Dispatch)
Location: `/rechnungsversand`

Features:
- Tabs for Invoice and Dunning emails
- Three-step wizard:
  1. Select company
  2. Select invoice
  3. Edit email (pre-filled from templates)
- Shows attachments that will be included
- Validates company has email address

## Configuration

Frontend API URL can be configured via environment variable:
```
VITE_API_URL=https://your-api-url.com/api
```

Default: `http://localhost:3000/api`

## Security Considerations

### Current Implementation
- All routes require authentication via JWT token
- SMTP passwords are stored in database (should be encrypted in production)

### Recommendations for Production
1. **Rate Limiting**: Add rate limiting middleware to prevent abuse of email sending endpoints
2. **Password Encryption**: Encrypt SMTP passwords in the database
3. **Email Validation**: Add additional validation for email addresses
4. **Attachment Size Limits**: Implement size limits for PDF generation
5. **Email Queue**: Consider using a queue system for email sending to handle failures and retries

## Usage Example

### Configuring SMTP
1. Navigate to Settings (Einstellungen)
2. Fill in SMTP server details
3. Click "Test Connection" to verify
4. Save settings

### Sending an Invoice
1. Navigate to Email Dispatch (Rechnungsversand)
2. Select a company from the dropdown
3. Select an invoice for that company
4. Review and edit the pre-filled email content
5. Click "Send Email"
6. System automatically attaches Invoice PDF and Stundenreport PDF

## Template Placeholders

### Invoice Templates
- `{{invoice_number}}`: The invoice number (e.g., RE-2025-0001)
- `{{company_name}}`: The company name
- `{{period}}`: The billing period (e.g., 01.01.2025 - 31.01.2025)

### Dunning Templates
- `{{invoice_number}}`: The invoice number
- `{{company_name}}`: The company name

## Technical Details

### Email Sending Process
1. Fetch invoice and company details from database
2. Generate Invoice PDF as buffer
3. Generate Stundenreport PDF as buffer (based on invoice period)
4. Load SMTP settings from database
5. Create nodemailer transporter
6. Send email with both PDF attachments

### PDF Generation
- Uses pdfkit library
- Generates professional-looking PDFs with company branding
- Stundenreport includes holidays and early takeovers
- Both PDFs are generated on-the-fly (not stored on disk)
