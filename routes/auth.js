import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { getDB } from '../db/database.js'
import { JWT_SECRET } from '../middleware/auth.js'

const router = Router()

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' })
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    const db = getDB()
    const existing = db.data.users.find(u => u.email === email.toLowerCase())
    if (existing) return res.status(409).json({ error: 'Email already registered' })
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = { id: uuidv4(), name: name.trim(), email: email.toLowerCase().trim(), password: hashedPassword, createdAt: new Date().toISOString() }
    db.data.users.push(user)
    await db.write()
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' })
    const { password: _, ...safeUser } = user
    res.status(201).json({ token, user: safeUser })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })
    const db = getDB()
    const user = db.data.users.find(u => u.email === email.toLowerCase())
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' })
    const { password: _, ...safeUser } = user
    res.json({ token, user: safeUser })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token' })
    const decoded = jwt.verify(token, JWT_SECRET)
    const db = getDB()
    const user = db.data.users.find(u => u.id === decoded.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    const { password: _, ...safeUser } = user
    res.json(safeUser)
  } catch { res.status(401).json({ error: 'Invalid token' }) }
})

export default router
