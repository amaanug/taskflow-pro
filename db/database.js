import { JSONFilePreset } from 'lowdb/node'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const defaultData = {
  users: [],
  projects: [],
  projectMembers: [],
  tasks: []
}

let db

export async function initDB() {
  const dbPath = process.env.DB_PATH || join(__dirname, '..', 'data.json')
  db = await JSONFilePreset(dbPath, defaultData)
  console.log('✅ Database ready at', dbPath)
  return db
}

export function getDB() {
  if (!db) throw new Error('DB not initialized')
  return db
}
