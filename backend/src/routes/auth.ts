import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const router = Router()
const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, role } = req.body

    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
      return res.status(400).json({ error: 'Benutzer existiert bereits' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, password: hashedPassword, role }
    })

    res.status(201).json({ id: user.id, username: user.username, role: user.role })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Fehler bei der Registrierung' })
  }
})

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Fehler beim Anmelden' })
  }
})

export default router
