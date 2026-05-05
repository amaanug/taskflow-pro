# TaskFlow Pro — Team Task Manager

> A full-stack team collaboration and task management app with role-based access control.

![TaskFlow Pro](https://img.shields.io/badge/TaskFlow-Pro-6c63ff?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

---

## 🚀 Live Demo

**[→ View Live App](YOUR_RAILWAY_URL_HERE)**

---

## ✨ Features

### Authentication
- ✅ User Signup & Login with secure JWT tokens
- ✅ Password hashing with bcrypt
- ✅ Token-based session management (7-day expiry)
- ✅ Protected routes (API + UI)

### Project Management
- ✅ Create, edit, and delete projects
- ✅ Invite team members by email
- ✅ Role-based access: **Admin** and **Member**
- ✅ Project progress tracking (completion percentage)

### Task Management
- ✅ Create tasks with title, description, priority, and due date
- ✅ Assign tasks to project members
- ✅ 4-stage status workflow: `To Do → In Progress → In Review → Done`
- ✅ Priority levels: `Low / Medium / High / Critical`
- ✅ Overdue detection
- ✅ Full CRUD for tasks

### Dashboard
- ✅ Stats overview (projects, tasks, assigned to me, overdue)
- ✅ Status breakdown bar chart
- ✅ Recent activity feed
- ✅ Quick project access

### Kanban Board
- ✅ Visual board view grouped by status
- ✅ Click any task to view/edit details
- ✅ List view alternative

---

## 🔐 Role-Based Access Control

| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ✅ |
| Edit project | ✅ | ❌ |
| Delete project | ✅ | ❌ |
| Invite members | ✅ | ❌ |
| Remove members | ✅ | ❌ |
| Change member roles | ✅ | ❌ |
| Create tasks | ✅ | ✅ |
| Edit any task | ✅ | Own tasks only |
| Delete any task | ✅ | Own tasks only |
| Update task status | ✅ | If assignee |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 20+ |
| **Framework** | Express.js 4.x |
| **Database** | LowDB (JSON file, zero-config) |
| **Auth** | JWT + bcryptjs |
| **Frontend** | Vanilla JS SPA (no build step) |
| **Deployment** | Railway |

---

## 📡 REST API

### Authentication
```
POST /api/auth/signup     — Register new user
POST /api/auth/login      — Login, returns JWT
GET  /api/auth/me         — Get current user info
```

### Projects
```
GET    /api/projects                          — List user's projects
POST   /api/projects                          — Create project
GET    /api/projects/:id                      — Get project with members & tasks
PUT    /api/projects/:id                      — Update project (Admin)
DELETE /api/projects/:id                      — Delete project (Admin)
POST   /api/projects/:id/members              — Invite member (Admin)
DELETE /api/projects/:id/members/:userId      — Remove member (Admin)
PATCH  /api/projects/:id/members/:userId/role — Change member role (Admin)
```

### Tasks
```
GET    /api/tasks                  — All tasks for current user (filterable by ?projectId=)
POST   /api/tasks                  — Create task
PATCH  /api/tasks/:id              — Update task (status, assignee, priority, etc.)
DELETE /api/tasks/:id              — Delete task
GET    /api/tasks/dashboard        — Dashboard summary stats
```

### Validation
All endpoints validate inputs and return structured errors:
```json
{ "error": "Human-readable error message" }
```

---

## 🏃 Running Locally

### Prerequisites
- Node.js 18+ 

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/taskflow-pro.git
cd taskflow-pro

# 2. Install dependencies
npm install

# 3. Start the server
npm start

# 4. Open in browser
open http://localhost:3000
```

No `.env` file needed for local dev. The app uses sensible defaults.

### Environment Variables (optional)
```env
PORT=3000              # Server port (default: 3000)
JWT_SECRET=your_secret # JWT signing secret (use a strong random value in production)
DB_PATH=./data.json    # Path to JSON database file
```

---

## 🚂 Deploy to Railway

### One-click deploy
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

### Manual steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/taskflow-pro.git
   git push -u origin main
   ```

2. **Create Railway project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repo

3. **Set environment variables** in Railway dashboard:
   ```
   JWT_SECRET=your_super_secret_random_string_here
   NODE_ENV=production
   ```

4. **Railway auto-detects** Node.js and runs `npm start`

5. **Get your URL** from the Railway dashboard — it's live!

> **Note**: Data persists in a `data.json` file. For production with multiple instances, swap LowDB for PostgreSQL using Railway's Postgres plugin.

---

## 📁 Project Structure

```
taskflow-pro/
├── server.js              # Express app entry point
├── package.json           # Dependencies & scripts
├── railway.toml           # Railway deployment config
├── .gitignore
├── db/
│   └── database.js        # LowDB setup & initialization
├── middleware/
│   └── auth.js            # JWT authentication & role checking
├── routes/
│   ├── auth.js            # Signup, login, /me
│   ├── projects.js        # Project CRUD + member management
│   └── tasks.js           # Task CRUD + dashboard
└── public/
    └── index.html         # Full frontend SPA (single file)
```

---

## 🎯 Key Design Decisions

1. **LowDB for zero-config persistence** — No database server to set up. Works out of the box on Railway. Can be swapped for PostgreSQL with minimal code changes.

2. **Single-file frontend** — No build step, no bundler. The entire frontend is one HTML file with embedded CSS and JS. Ships fast, works everywhere.

3. **JWT auth** — Stateless, scalable. Tokens expire in 7 days.

4. **Role checks in middleware** — `requireProjectRole()` middleware cleanly enforces Admin/Member access at the route level.

---

## 📄 License

MIT — use freely.
