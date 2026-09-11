# CollabCode — Real-Time Collaborative Coding Platform

A full-stack platform where multiple developers can join a shared room, edit code together in real time, chat, and execute code — with low latency.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Monaco Editor, Socket.IO client, TailwindCSS |
| Backend | Node.js, Express.js |
| Real-time | Socket.IO (with Redis adapter) |
| Database | MySQL (Sequelize ORM) |
| Caching/Pub-Sub | Redis |
| Auth | JWT (access + refresh), bcrypt |
| Code Execution | Judge0 API |
| Deployment | Docker Compose, Nginx |

## Project Structure

```
collabcode/
├── backend/          # Express API + Socket.IO server
│   ├── src/
│   │   ├── config/       # DB, Redis, JWT config
│   │   ├── models/       # Sequelize models
│   │   ├── routes/       # REST API routes
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Auth, rate limit, error handling
│   │   ├── socket/       # Socket.IO event handlers
│   │   ├── services/     # Business logic (execution, rooms)
│   │   └── utils/        # Helpers, logger
│   └── server.js
├── frontend/         # React + Vite app
│   ├── src/
│   │   ├── api/          # Axios service layer
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # Auth, Socket contexts
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Route-level page components
│   │   └── utils/
│   └── index.html
├── nginx/            # Nginx reverse proxy config
├── docker-compose.yml
└── README.md
```

## Quick Start (Development)

### Prerequisites
- Node.js 18+
- MySQL 8+
- Redis 7+
- Docker (optional, for full stack)

### 1. Clone and install
```bash
git clone <repo-url>
cd collabcode
npm install
```

### 2. Configure environment
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit both .env files with your credentials
```

### 3. Run database migrations
```bash
cd backend
npx sequelize-cli db:migrate
```

### 4. Start development servers
```bash
# Terminal 1 — backend
npm run dev:backend

# Terminal 2 — frontend
npm run dev:frontend
```

### 5. Docker Compose (full stack)
```bash
docker-compose up --build
```

The app will be available at `http://localhost` (Nginx) or:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`

## Features

- **Real-time collaborative editing** with Yjs CRDT (conflict-free concurrent edits)
- **Live cursor & presence** — see every collaborator's cursor and name
- **Multi-file support** — full file explorer per room
- **Room roles** — Owner, Editor, Viewer with server-enforced permissions
- **Sandboxed code execution** via Judge0 API
- **In-room text chat** with typing indicators
- **JWT auth** with access + refresh token rotation
- **Version history** — snapshots with rollback
- **Redis-backed Socket.IO** for horizontal scaling
- **Auto-save** every 5 seconds

## License
MIT
