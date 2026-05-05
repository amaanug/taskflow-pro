import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initDB } from './db/database.js'
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import taskRoutes from './routes/tasks.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(express.static(join(__dirname, 'public')))

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/tasks', taskRoutes)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.get('*', (req, res) => res.sendFile(join(__dirname, 'public', 'index.html')))

async function start() {
  await initDB()
  app.listen(PORT, () => console.log(`🚀 TaskFlow running on port ${PORT}`))
}

start()
