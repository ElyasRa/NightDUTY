import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// Get all users (protected)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        created_at: true
      },
      orderBy: { username: 'asc' }
    })
    
    res.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Fehler beim Abrufen der Benutzer' })
  }
})

// Create a new user (protected, admin only)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Keine Berechtigung' })
    }

    const { username, password, role } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Benutzername und Passwort sind erforderlich' })
    }

    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
      return res.status(400).json({ error: 'Benutzer existiert bereits' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { 
        username, 
        password: hashedPassword, 
        role: role || 'user' 
      },
      select: {
        id: true,
        username: true,
        role: true,
        created_at: true
      }
    })

    res.status(201).json(user)
  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({ error: 'Fehler beim Erstellen des Benutzers' })
  }
})

// Update user password (protected, admin only)
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Keine Berechtigung' })
    }

    const { id } = req.params
    const { password, role } = req.body

    const updateData: { password?: string; role?: string } = {}

    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    if (role) {
      updateData.role = role
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Keine Daten zum Aktualisieren' })
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        created_at: true
      }
    })

    res.json(user)
  } catch (error: any) {
    console.error('Error updating user:', error)
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Benutzer nicht gefunden' })
    } else {
      res.status(500).json({ error: 'Fehler beim Aktualisieren des Benutzers' })
    }
  }
})

// Delete a user (protected, admin only)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Keine Berechtigung' })
    }

    const { id } = req.params
    const userId = parseInt(id)

    // Prevent deleting own account
    if (req.user?.id === userId) {
      return res.status(400).json({ error: 'Sie können Ihren eigenen Account nicht löschen' })
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    res.json({ message: 'Benutzer gelöscht' })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Benutzer nicht gefunden' })
    } else {
      res.status(500).json({ error: 'Fehler beim Löschen des Benutzers' })
    }
  }
})

export default router
