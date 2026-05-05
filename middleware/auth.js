import jwt from 'jsonwebtoken'
import { getDB } from '../db/database.js'

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow_super_secret_2024'

export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const db = getDB()
    const user = db.data.users.find(u => u.id === decoded.id)
    if (!user) return res.status(401).json({ error: 'User not found' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireProjectRole(...roles) {
  return (req, res, next) => {
    const db = getDB()
    const projectId = req.params.projectId || req.body.projectId
    const member = db.data.projectMembers.find(
      m => m.projectId === projectId && m.userId === req.user.id
    )
    if (!member || !roles.includes(member.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    req.projectRole = member.role
    next()
  }
}

export { JWT_SECRET }
