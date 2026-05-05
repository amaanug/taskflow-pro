import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDB } from '../db/database.js'
import { authenticate, requireProjectRole } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', (req, res) => {
  const db = getDB()
  const memberEntries = db.data.projectMembers.filter(m => m.userId === req.user.id)
  const projectIds = memberEntries.map(m => m.projectId)
  const projects = db.data.projects.filter(p => projectIds.includes(p.id)).map(p => {
    const members = db.data.projectMembers.filter(m => m.projectId === p.id)
    const tasks = db.data.tasks.filter(t => t.projectId === p.id)
    const myRole = memberEntries.find(m => m.projectId === p.id)?.role
    return { ...p, memberCount: members.length, taskCount: tasks.length, completedTasks: tasks.filter(t => t.status === 'done').length, myRole }
  })
  res.json(projects)
})

router.post('/', async (req, res) => {
  const { name, description } = req.body
  if (!name) return res.status(400).json({ error: 'Project name is required' })
  const db = getDB()
  const project = { id: uuidv4(), name: name.trim(), description: description?.trim() || '', createdBy: req.user.id, createdAt: new Date().toISOString() }
  db.data.projects.push(project)
  db.data.projectMembers.push({ id: uuidv4(), projectId: project.id, userId: req.user.id, role: 'Admin', joinedAt: new Date().toISOString() })
  await db.write()
  res.status(201).json(project)
})

router.get('/:projectId', (req, res) => {
  const db = getDB()
  const project = db.data.projects.find(p => p.id === req.params.projectId)
  if (!project) return res.status(404).json({ error: 'Project not found' })
  const member = db.data.projectMembers.find(m => m.projectId === project.id && m.userId === req.user.id)
  if (!member) return res.status(403).json({ error: 'Not a member' })
  const members = db.data.projectMembers.filter(m => m.projectId === project.id).map(m => {
    const user = db.data.users.find(u => u.id === m.userId)
    return { ...m, user: user ? { id: user.id, name: user.name, email: user.email } : null }
  })
  const tasks = db.data.tasks.filter(t => t.projectId === project.id).map(t => {
    const assignee = t.assigneeId ? db.data.users.find(u => u.id === t.assigneeId) : null
    const creator = db.data.users.find(u => u.id === t.createdBy)
    return { ...t, assignee: assignee ? { id: assignee.id, name: assignee.name } : null, creator: creator ? { id: creator.id, name: creator.name } : null }
  })
  res.json({ ...project, members, tasks, myRole: member.role })
})

router.put('/:projectId', requireProjectRole('Admin'), async (req, res) => {
  const { name, description } = req.body
  const db = getDB()
  const idx = db.data.projects.findIndex(p => p.id === req.params.projectId)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  if (name) db.data.projects[idx].name = name.trim()
  if (description !== undefined) db.data.projects[idx].description = description.trim()
  await db.write()
  res.json(db.data.projects[idx])
})

router.delete('/:projectId', requireProjectRole('Admin'), async (req, res) => {
  const db = getDB()
  const projectId = req.params.projectId
  db.data.projects = db.data.projects.filter(p => p.id !== projectId)
  db.data.projectMembers = db.data.projectMembers.filter(m => m.projectId !== projectId)
  db.data.tasks = db.data.tasks.filter(t => t.projectId !== projectId)
  await db.write()
  res.json({ message: 'Project deleted' })
})

router.post('/:projectId/members', requireProjectRole('Admin'), async (req, res) => {
  const { email, role } = req.body
  if (!email) return res.status(400).json({ error: 'Email is required' })
  if (!['Admin', 'Member'].includes(role)) return res.status(400).json({ error: 'Invalid role' })
  const db = getDB()
  const invitee = db.data.users.find(u => u.email === email.toLowerCase())
  if (!invitee) return res.status(404).json({ error: 'User not found. They must sign up first.' })
  const existing = db.data.projectMembers.find(m => m.projectId === req.params.projectId && m.userId === invitee.id)
  if (existing) return res.status(409).json({ error: 'Already a member' })
  const membership = { id: uuidv4(), projectId: req.params.projectId, userId: invitee.id, role, joinedAt: new Date().toISOString() }
  db.data.projectMembers.push(membership)
  await db.write()
  res.status(201).json({ ...membership, user: { id: invitee.id, name: invitee.name, email: invitee.email } })
})

router.delete('/:projectId/members/:userId', requireProjectRole('Admin'), async (req, res) => {
  const db = getDB()
  if (req.params.userId === req.user.id) return res.status(400).json({ error: 'Cannot remove yourself' })
  db.data.projectMembers = db.data.projectMembers.filter(m => !(m.projectId === req.params.projectId && m.userId === req.params.userId))
  await db.write()
  res.json({ message: 'Member removed' })
})

router.patch('/:projectId/members/:userId/role', requireProjectRole('Admin'), async (req, res) => {
  const { role } = req.body
  if (!['Admin', 'Member'].includes(role)) return res.status(400).json({ error: 'Invalid role' })
  const db = getDB()
  const idx = db.data.projectMembers.findIndex(m => m.projectId === req.params.projectId && m.userId === req.params.userId)
  if (idx === -1) return res.status(404).json({ error: 'Member not found' })
  db.data.projectMembers[idx].role = role
  await db.write()
  res.json(db.data.projectMembers[idx])
})

export default router
