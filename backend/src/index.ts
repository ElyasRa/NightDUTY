import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import companyRoutes from './routes/companies'
import reportsRoutes from './routes/reports'
import takeoversRoutes from './routes/takeovers'
import invoicesRoutes from './routes/invoices'
import dunningRoutes from './routes/dunning'
import settingsRoutes from './routes/settings'
import emailRoutes from './routes/email'
import usersRoutes from './routes/users'
import compensationRoutes from './routes/compensation'

const app = express()

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/companies', companyRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/takeovers', takeoversRoutes)
app.use('/api/invoices', invoicesRoutes)
app.use('/api/dunning', dunningRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/email', emailRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/compensation', compensationRoutes)

// Static files
app.use(express.static('public'))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
