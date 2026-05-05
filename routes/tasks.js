import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDB } from '../db/database.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

function enrichTask(db, task) {
  const assignee = task.assigneeId ? db.data.users.find(u => u.id === task.assigneeId) : null
  const creator = db.data.users.find(u => u.id === task.createdBy)
  const project = db.data.projects.find(p => p.id === task.projectId)
  return { ...task, assignee: assignee ? { id: assignee.id, name: assignee.name } : null, creator: creator ? { id: creator.id, name: creator.name } : null, projectName: project?.name || '' }
}

router.get('/dashboard', (req, res) => {
  const db = getDB()
  const memberProjectIds = db.data.projectMembers.filter(m => m.userId === req.user.id).map(m => m.projectId)
  const allTasks = db.data.tasks.filter(t => memberProjectIds.includes(t.projectId))
  const now = new Date()
  const overdue = allTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done')
  res.json({
    totalProjects: memberProjectIds.length, totalTasks: allTasks.length,
    myTasks: allTasks.filter(t => t.assigneeId === req.user.id).length,
    byStatus: { todo: allTasks.filter(t => t.status === 'todo').length, in_progress: allTasks.filter(t => t.status === 'in_progress').length, in_review: allTasks.filter(t => t.status === 'in_review').length, done: allTasks.filter(t => t.status === 'done').length },
    overdue: overdue.length,
    recentTasks: [...allTasks].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5).map(t => enrichTask(db, t))
  })
})

router.get('/', (req, res) => {
  const { projectId } = req.query
  const db = getDB()
  const memberProjectIds = db.data.projectMembers.filter(m => m.userId === req.user.id).map(m => m.projectId)
  if (projectId) {
    if (!memberProjectIds.includes(projectId)) return res.status(403).json({ error: 'Not a member' })
    return res.json(db.data.tasks.filter(t => t.projectId === projectId).map(t => enrichTask(db, t)))
  }
  res.json(db.data.tasks.filter(t => memberProjectIds.includes(t.projectId)).map(t => enrichTask(db, t)))
})

router.post('/', async (req, res) => {
  const { projectId, title, description, assigneeId, priority, dueDate } = req.body
  if (!projectId || !title) return res.status(400).json({ error: 'projectId and title required' })
  const db = getDB()
  const member = db.data.projectMembers.find(m => m.projectId === projectId && m.userId === req.user.id)
  if (!member) return res.status(403).json({ error: 'Not a member' })
  const task = { id: uuidv4(), projectId, title: title.trim(), description: description?.trim() || '', status: 'todo', priority: ['low','medium','high','critical'].includes(priority) ? priority : 'medium', assigneeId: assigneeId || null, dueDate: dueDate || null, createdBy: req.user.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  db.data.tasks.push(task)
  await db.write()
  res.status(201).json(enrichTask(db, task))
})

router.patch('/:taskId', async (req, res) => {
  const db = getDB()
  const idx = db.data.tasks.findIndex(t => t.id === req.params.taskId)
  if (idx === -1) return res.status(404).json({ error: 'Task not found' })
  const task = db.data.tasks[idx]
  const member = db.data.projectMembers.find(m => m.projectId === task.projectId && m.userId === req.user.id)
  if (!member) return res.status(403).json({ error: 'Not a member' })
  const isAdmin = member.role === 'Admin'
  const isCreator = task.createdBy === req.user.id
  const isAssignee = task.assigneeId === req.user.id
  const { title, description, status, priority, assigneeId, dueDate } = req.body
  if (isAdmin || isCreator) {
    if (title) task.title = title.trim()
    if (description !== undefined) task.description = description.trim()
    if (priority) task.priority = priority
    if (assigneeId !== undefined) task.assigneeId = assigneeId || null
    if (dueDate !== undefined) task.dueDate = dueDate || null
  }
  if (status && (isAdmin || isCreator || isAssignee)) task.status = status
  task.updatedAt = new Date().toISOString()
  db.data.tasks[idx] = task
  await db.write()
  res.json(enrichTask(db, task))
})

router.delete('/:taskId', async (req, res) => {
  const db = getDB()
  const task = db.data.tasks.find(t => t.id === req.params.taskId)
  if (!task) return res.status(404).json({ error: 'Task not found' })
  const member = db.data.projectMembers.find(m => m.projectId === task.projectId && m.userId === req.user.id)
  if (!member?.role === 'Admin' && task.createdBy !== req.user.id) return res.status(403).json({ error: 'Insufficient permissions' })
  db.data.tasks = db.data.tasks.filter(t => t.id !== req.params.taskId)
  await db.write()
  res.json({ message: 'Task deleted' })
})

export default router
