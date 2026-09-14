# CollabCode — Complete Technical Documentation

> Real-Time Collaborative Coding Platform  
> Version 1.0 | September 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Directory Structure](#4-directory-structure)
5. [Database Design](#5-database-design)
6. [Backend Architecture](#6-backend-architecture)
7. [REST API Reference](#7-rest-api-reference)
8. [WebSocket Event System](#8-websocket-event-system)
9. [Authentication & Security](#9-authentication--security)
10. [Real-Time Collaboration (CRDT / Yjs)](#10-real-time-collaboration-crdt--yjs)
11. [Frontend Architecture](#11-frontend-architecture)
12. [State Management](#12-state-management)
13. [Code Execution Pipeline](#13-code-execution-pipeline)
14. [Email Service](#14-email-service)
15. [Deployment Architecture](#15-deployment-architecture)
16. [Data Flow Diagrams](#16-data-flow-diagrams)
17. [Security Checklist](#17-security-checklist)
18. [Performance Design](#18-performance-design)
19. [Glossary](#19-glossary)

---

## 1. Project Overview

CollabCode is a **full-stack real-time collaborative coding platform** that allows multiple developers to:

- Join shared "rooms" and edit code simultaneously
- See each other's cursors and selections live
- Chat in real time alongside the editor
- Execute code and see shared output
- Manage files in a per-room file explorer
- Control access with role-based permissions

### Core Problem it Solves

Traditional code editors are single-user. When teams pair-program or do code reviews, they resort to screen sharing which is laggy and one-directional. CollabCode solves this by providing a native multi-user editing experience similar to Google Docs but for code.

### Key Metrics Target
| Metric | Target |
|--------|--------|
| Edit propagation latency | < 150ms |
| Max users per room | 10 |
| Uptime | 99% |
| Code execution timeout | 10 seconds |

---

## 2. System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│                                                                   │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │ React + Vite │   │Monaco Editor │   │  Socket.IO Client    │ │
│  │  TailwindCSS │   │  + Yjs CRDT  │   │  (WebSocket)         │ │
│  └──────┬───────┘   └──────┬───────┘   └──────────┬───────────┘ │
│         │                  │                       │             │
└─────────┼──────────────────┼───────────────────────┼─────────────┘
          │ HTTPS REST        │ Yjs Updates           │ WS Events
          ▼                  ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     VERCEL (CDN + Edge)                          │
│                   Static Frontend Assets                         │
└─────────────────────────────┬───────────────────────────────────┘
                              │ Proxy / Direct
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   RAILWAY (Backend Server)                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Node.js / Express                      │    │
│  │                                                           │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │    │
│  │  │  REST API    │  │  Socket.IO   │  │  Middleware   │  │    │
│  │  │  Routes      │  │  Server      │  │  (Auth/CORS)  │  │    │
│  │  └──────┬───────┘  └──────┬───────┘  └───────────────┘  │    │
│  │         │                 │                               │    │
│  │  ┌──────▼─────────────────▼───────┐                      │    │
│  │  │        Business Logic Layer    │                      │    │
│  │  │   Controllers / Services       │                      │    │
│  │  └──────┬─────────────────────────┘                      │    │
│  │         │                                                  │    │
│  │  ┌──────▼──────────────────────────────────────────────┐  │    │
│  │  │              Sequelize ORM                           │  │    │
│  │  └──────┬───────────────────────────────────────────────┘  │    │
│  └─────────┼───────────────────────────────────────────────────┘   │
│            │                                                         │
│  ┌─────────▼──────────┐    ┌────────────────────┐                  │
│  │   MySQL Database   │    │   In-Memory Store  │                  │
│  │   (Railway MySQL)  │    │  (Room State/Cache)│                  │
│  └────────────────────┘    └────────────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Resend API       │
                    │  (Email Service)   │
                    └────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Judge0 API       │
                    │ (Code Execution)   │
                    └────────────────────┘
```

### Request Flow Types

There are **three types of communication** in CollabCode:

```
1. REST (HTTP)
   Browser ──HTTPS──▶ Express Router ──▶ Controller ──▶ MySQL
   Used for: auth, room CRUD, file management, chat history

2. WebSocket (Socket.IO)
   Browser ◀──WS──▶ Socket.IO Server ◀──▶ In-Memory State
   Used for: live code edits, cursor positions, chat messages, code runs

3. External API (HTTPS)
   Backend ──HTTPS──▶ Judge0 API  (code execution)
   Backend ──HTTPS──▶ Resend API  (emails)
```

---

## 3. Technology Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 24.x | JavaScript runtime |
| Express.js | 4.19 | HTTP server framework |
| Socket.IO | 4.7 | Real-time WebSocket server |
| Sequelize | 6.37 | MySQL ORM |
| MySQL2 | 3.9 | MySQL database driver |
| bcryptjs | 2.4 | Password hashing |
| jsonwebtoken | 9.0 | JWT signing/verification |
| nodemailer | 6.9 | Email transport (SMTP) |
| express-rate-limit | 7.3 | API rate limiting |
| express-validator | 7.1 | Input validation |
| helmet | 7.1 | HTTP security headers |
| cors | 2.8 | Cross-origin resource sharing |
| winston | 3.13 | Structured logging |
| axios | 1.7 | HTTP client for Judge0 |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3 | UI component library |
| Vite | 5.3 | Build tool and dev server |
| TailwindCSS | 3.4 | Utility-first CSS framework |
| Monaco Editor | 0.50 | VS Code editor component |
| Yjs | 13.6 | CRDT for conflict-free editing |
| y-monaco | 0.1 | Yjs binding for Monaco |
| Socket.IO Client | 4.7 | WebSocket client |
| React Router | 6.24 | Client-side routing |
| Axios | 1.7 | HTTP client |
| lucide-react | 0.395 | Icon library |
| date-fns | 3.6 | Date formatting |

### Infrastructure
| Service | Purpose | Tier |
|---|---|---|
| Railway | Backend hosting + MySQL | Free ($5 credit/month) |
| Vercel | Frontend hosting (CDN) | Free |
| Resend | Transactional email | Free (3K/month) |
| Judge0 CE | Code execution sandbox | Free (50 req/day) |
| GitHub | Source control + CI/CD | Free |

---

## 4. Directory Structure

```
collabcode/
├── backend/                        # Express + Socket.IO server
│   ├── server.js                   # Entry point — bootstraps all services
│   ├── package.json
│   ├── railway.toml                # Railway deployment config
│   ├── .env.example                # Environment variable template
│   └── src/
│       ├── config/
│       │   ├── database.js         # Sequelize connection + sync
│       │   ├── redis.js            # Redis client (optional)
│       │   ├── jwt.js              # JWT sign/verify helpers
│       │   └── tokenStore.js       # In-memory/Redis token store
│       ├── models/
│       │   ├── index.js            # Model associations
│       │   ├── User.js
│       │   ├── Room.js
│       │   ├── RoomMember.js
│       │   ├── File.js
│       │   ├── FileVersion.js
│       │   ├── Execution.js
│       │   └── Message.js
│       ├── controllers/
│       │   ├── authController.js   # signup, login, refresh, logout
│       │   ├── userController.js   # getMe, updateMe
│       │   ├── roomController.js   # CRUD rooms, join, roles
│       │   ├── fileController.js   # CRUD files, versions, restore
│       │   ├── executionController.js
│       │   ├── chatController.js
│       │   └── passwordController.js # forgot/reset password
│       ├── routes/
│       │   ├── auth.js
│       │   ├── users.js
│       │   └── rooms.js            # rooms + files + execution + chat
│       ├── middleware/
│       │   ├── auth.js             # JWT authentication guard
│       │   ├── rateLimiter.js      # express-rate-limit configs
│       │   ├── errorHandler.js     # Global error + 404 handler
│       │   └── validate.js         # express-validator runner
│       ├── socket/
│       │   ├── index.js            # All Socket.IO event handlers
│       │   ├── socketAuth.js       # Socket authentication middleware
│       │   └── roomState.js        # In-memory room presence + cache
│       ├── services/
│       │   ├── executionService.js # Judge0 API integration
│       │   └── emailService.js     # Resend HTTP API
│       └── utils/
│           ├── logger.js           # Winston logger
│           └── helpers.js          # generateRoomCode, pickCursorColor
│
├── frontend/                       # React + Vite app
│   ├── index.html
│   ├── vite.config.js              # Dev proxy config
│   ├── tailwind.config.js
│   ├── vercel.json                 # SPA routing + cache headers
│   └── src/
│       ├── main.jsx                # React entry point
│       ├── App.jsx                 # Router + AuthProvider
│       ├── index.css               # Tailwind base + component classes
│       ├── api/
│       │   ├── axios.js            # Axios instance + token refresh interceptor
│       │   ├── auth.js             # Auth API calls
│       │   └── rooms.js            # Rooms/files/execution/chat API calls
│       ├── contexts/
│       │   ├── AuthContext.jsx     # Global auth state (user, login, logout)
│       │   ├── SocketContext.jsx   # Socket.IO connection provider
│       │   └── ThemeContext.jsx    # Dark/light mode toggle
│       ├── hooks/
│       │   ├── useAuth.js          # Consume AuthContext
│       │   ├── useSocket.js        # Consume SocketContext
│       │   └── useRoom.js          # All room socket events + state
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── SignupPage.jsx
│       │   ├── ForgotPasswordPage.jsx
│       │   ├── ResetPasswordPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── RoomPage.jsx
│       │   └── NotFoundPage.jsx
│       └── components/
│           ├── Avatar.jsx
│           ├── ConnectionBadge.jsx
│           ├── Modal.jsx
│           ├── Navbar.jsx
│           ├── Spinner.jsx
│           └── room/
│               ├── RoomLayout.jsx     # Main room UI shell
│               ├── CollabEditor.jsx   # Monaco + Yjs CRDT
│               ├── FileExplorer.jsx   # File tree sidebar
│               ├── ChatPanel.jsx      # Real-time chat
│               ├── TerminalPanel.jsx  # Code execution output
│               ├── MembersPanel.jsx   # Online members + role management
│               └── ExecutionPanel.jsx
│
├── db/
│   ├── init.sql                    # DB + user creation (Docker/local)
│   └── setup_local.sql             # Local MySQL Workbench setup
├── nginx/
│   └── nginx.conf                  # Reverse proxy config
├── docker-compose.yml              # Full stack Docker orchestration
├── docker-compose.dev.yml          # Dev override (hot reload)
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions CI pipeline
└── README.md
```

---

## 5. Database Design

### Entity-Relationship Diagram

```
┌──────────────┐         ┌──────────────────┐         ┌──────────────┐
│    users     │         │      rooms       │         │ room_members │
├──────────────┤         ├──────────────────┤         ├──────────────┤
│ id (PK)      │◄────────│ owner_id (FK)    │         │ id (PK)      │
│ username     │         │ id (PK)          │◄────────│ room_id (FK) │
│ email        │         │ room_code        │         │ user_id (FK) │
│ password_hash│         │ name             │    ┌───►│ role         │
│ avatar_color │         │ is_private       │    │    │ joined_at    │
│ created_at   │◄────────┤ password_hash    │    │    └──────────────┘
└──────────────┘    │    │ language         │    │
       │            │    │ max_members      │    │
       │            │    │ last_active_at   │    │
       │            │    │ created_at       │    │
       │            │    └──────────────────┘    │
       │            │             │              │
       │            │             │ has many     │
       │            │             ▼              │
       │            │    ┌──────────────┐        │
       │            │    │    files     │        │
       │            │    ├──────────────┤        │
       │            │    │ id (PK)      │        │
       │            │    │ room_id (FK) │        │
       │            │    │ filename     │        │
       │            │    │ content      │        │
       │            │    │ language     │        │
       │            │    │ updated_at   │        │
       │            │    └──────┬───────┘        │
       │            │           │ has many       │
       │            │           ▼                │
       │            │    ┌──────────────────┐    │
       │            │    │  file_versions   │    │
       │            │    ├──────────────────┤    │
       │            │    │ id (PK)          │    │
       │            │    │ file_id (FK)     │    │
       │            └───►│ saved_by (FK)    │    │
       │                 │ content          │    │
       │                 │ created_at       │    │
       │                 └──────────────────┘    │
       │                                         │
       │                 ┌──────────────────┐    │
       │                 │    executions    │    │
       │                 ├──────────────────┤    │
       │                 │ id (PK)          │    │
       │                 │ room_id (FK)     │◄───┘
       └────────────────►│ triggered_by(FK) │
                         │ language         │
                         │ stdin            │
                         │ stdout           │
                         │ stderr           │
                         │ exec_time_ms     │
                         │ status           │
                         │ created_at       │
                         └──────────────────┘

                         ┌──────────────────┐
                         │    messages      │
                         ├──────────────────┤
                         │ id (PK)          │
                         │ room_id (FK)     │
                         │ user_id (FK)     │
                         │ content          │
                         │ created_at       │
                         └──────────────────┘
```

### Table Descriptions

**users** — Stores registered user accounts. Passwords are hashed with bcrypt (cost 12). `avatar_color` is a hex color for cursor display.

**rooms** — A room is a collaborative session. Has a unique `room_code` (8-char alphanumeric) used for sharing. Can be private with optional password protection.

**room_members** — Junction table linking users to rooms with a role (`owner`, `editor`, `viewer`). Unique constraint on `(room_id, user_id)`.

**files** — Files belong to a room. Content stored as LONGTEXT. Each room gets a default file on creation.

**file_versions** — Snapshot history. Created on every manual save or auto-save. Enables rollback.

**executions** — Log of every code run. Stores stdin/stdout/stderr, timing, and status from Judge0.

**messages** — Chat messages per room. Ordered by `created_at`.

---

## 6. Backend Architecture

### Layer Architecture

```
┌────────────────────────────────────────────────┐
│                   HTTP Layer                    │
│          Express Router + Middleware            │
│  helmet │ cors │ morgan │ compression │ rate-limit │
└─────────────────────┬──────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────┐
│               Authentication Layer              │
│         JWT Bearer Token Verification           │
│      middleware/auth.js → req.user attached     │
└─────────────────────┬──────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────┐
│              Validation Layer                   │
│    express-validator chains + validate()        │
│         Returns 422 on invalid input            │
└─────────────────────┬──────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────┐
│              Controller Layer                   │
│   Route handlers — orchestrate business logic  │
│   authController │ roomController │ fileController │
│   executionController │ chatController │ passwordController │
└─────────────────────┬──────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────┐
│               Service Layer                     │
│     External API integrations + heavy logic    │
│        executionService (Judge0)                │
│        emailService (Resend)                    │
└─────────────────────┬──────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────┐
│                Data Layer                       │
│          Sequelize ORM Models                   │
│   User │ Room │ RoomMember │ File │ FileVersion │
│   Execution │ Message                           │
└─────────────────────┬──────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────┐
│               MySQL Database                    │
│            Railway managed MySQL                │
└────────────────────────────────────────────────┘
```

### Server Bootstrap Sequence

```
server.js starts
    │
    ├── 1. Load .env (dotenv)
    ├── 2. Create Express app
    ├── 3. Register global middleware
    │       helmet, cors, compression, morgan, cookieParser, json parser
    ├── 4. Mount REST routes
    │       /api/auth, /api/users, /api/rooms
    ├── 5. Register 404 + error handlers
    ├── 6. Create HTTP server from Express app
    ├── 7. Create Socket.IO server attached to HTTP server
    ├── 8. Bootstrap async:
    │       ├── connectDB() → authenticate + sync tables
    │       ├── connectRedis() → optional, skipped if REDIS_DISABLED=true
    │       ├── Attach Redis adapter OR use default in-memory adapter
    │       ├── Register socketAuth middleware
    │       └── registerSocketHandlers(io)
    └── 9. httpServer.listen(PORT)
```

---

## 7. REST API Reference

### Base URL
```
Production:  https://collabcode-real-time-collaborative-coding-platfo-production.up.railway.app/api
Development: http://localhost:4000/api
```

### Authentication Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/signup` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login, get tokens |
| POST | `/auth/refresh` | Cookie | Rotate refresh token |
| POST | `/auth/logout` | Cookie | Revoke refresh token |
| POST | `/auth/forgot-password` | ❌ | Send reset email |
| POST | `/auth/reset-password` | ❌ | Set new password with token |
| GET | `/auth/verify-reset-token` | ❌ | Check if token is valid |

**Signup Request:**
```json
POST /api/auth/signup
{
  "username": "rohit0905",
  "email": "rohit@example.com",
  "password": "securepass123"
}
```

**Signup Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "rohit0905",
    "email": "rohit@example.com",
    "avatarColor": "#60A5FA"
  }
}
```

### Room Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/rooms` | ✅ | Create room |
| GET | `/rooms/mine` | ✅ | List my rooms |
| GET | `/rooms/:code` | ✅ | Get room details |
| POST | `/rooms/:code/join` | ✅ | Join room |
| DELETE | `/rooms/:code` | ✅ Owner | Delete room |
| PUT | `/rooms/:code/members/:userId/role` | ✅ Owner | Change member role |

### File Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/rooms/:code/files` | ✅ Member | List files |
| GET | `/rooms/:code/files/:id` | ✅ Member | Get file content |
| POST | `/rooms/:code/files` | ✅ Editor+ | Create file |
| PUT | `/rooms/:code/files/:id` | ✅ Editor+ | Save file |
| DELETE | `/rooms/:code/files/:id` | ✅ Editor+ | Delete file |
| GET | `/rooms/:code/files/:id/versions` | ✅ Member | Version history |
| POST | `/rooms/:code/files/:id/versions/:vid/restore` | ✅ Editor+ | Restore version |

### Execution & Chat Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/rooms/:code/execute` | ✅ Editor+ | Run code via Judge0 |
| GET | `/rooms/:code/executions` | ✅ Member | Execution history |
| GET | `/rooms/:code/messages` | ✅ Member | Chat history |

---

## 8. WebSocket Event System

### Connection Setup

```javascript
// Client connects with JWT token in auth handshake
const socket = io('https://backend.railway.app', {
  auth: { token: accessToken },
  transports: ['websocket', 'polling']
});
```

The server validates the token in `socketAuth.js` middleware before the connection is established. Invalid tokens are rejected immediately.

### Event Reference

**Client → Server Events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `{ roomCode }` | Join a room, get full state |
| `code_change` | `{ fileId, delta, version, content }` | Broadcast Yjs CRDT delta |
| `cursor_move` | `{ fileId, position, selection }` | Share cursor position |
| `chat_message` | `{ content }` | Send chat message |
| `typing_start` | — | I started typing in chat |
| `typing_stop` | — | I stopped typing in chat |
| `run_code` | `{ fileId, stdin }` | Execute code in room |
| `leave_room` | — | Leave the room |

**Server → Client Events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `room_state` | `{ files, members, role }` | Full room state on join |
| `user_joined` | `{ user }` | Someone joined the room |
| `user_left` | `{ userId }` | Someone left the room |
| `code_update` | `{ fileId, delta, version, authorId }` | Remote code change |
| `cursor_update` | `{ userId, fileId, position, selection, username, avatarColor }` | Remote cursor move |
| `chat_broadcast` | `{ id, user, content, timestamp }` | New chat message |
| `user_typing` | `{ userId, username }` | Someone typing in chat |
| `user_stopped_typing` | `{ userId }` | Someone stopped typing |
| `execution_result` | `{ stdout, stderr, status, execTimeMs, triggeredBy }` | Code run result |
| `error` | `{ message }` | Server-side error |

### Room Lifecycle

```
User opens room page
        │
        ▼
POST /api/rooms/:code/join  (REST)
        │
        ▼
Socket connects with JWT token
        │
        ▼
socket.emit('join_room', { roomCode })
        │
        ▼
Server: verify membership, load files from DB/cache
        │
        ▼
socket.emit('room_state', { files, members, role })
        │
        ▼
User joins Socket.IO room (socket.join(roomCode))
        │
        ▼
socket.to(roomCode).emit('user_joined', { user })
        │
        ▼
[User edits, chats, runs code...]
        │
        ▼
User closes tab / navigates away
        │
        ▼
socket.emit('leave_room')
        │
        ▼
Server: removeMember(), socket.to(roomCode).emit('user_left')
```

---

## 9. Authentication & Security

### JWT Token Flow

```
┌─────────┐                          ┌─────────────┐
│ Browser │                          │   Backend   │
└────┬────┘                          └──────┬──────┘
     │                                      │
     │  POST /auth/login                    │
     │ ─────────────────────────────────►  │
     │                                      │
     │                           Verify password (bcrypt.compare)
     │                           Generate Access Token (15 min)
     │                           Generate Refresh Token (7 days)
     │                           Store Refresh Token hash in memory/Redis
     │                                      │
     │  { accessToken } + Set-Cookie: refreshToken (httpOnly)
     │ ◄────────────────────────────────── │
     │                                      │
     │  Store accessToken in localStorage  │
     │                                      │
     │  GET /api/rooms/mine                 │
     │  Authorization: Bearer <accessToken> │
     │ ─────────────────────────────────►  │
     │                                      │
     │                           Verify JWT signature
     │                           Check expiry
     │                           Attach user to req.user
     │                                      │
     │  { rooms: [...] }                    │
     │ ◄────────────────────────────────── │
     │                                      │
     │  [15 min later — token expired]      │
     │                                      │
     │  POST /api/auth/refresh              │
     │  Cookie: refreshToken=xxx            │
     │ ─────────────────────────────────►  │
     │                                      │
     │                           Verify refresh token
     │                           Check it exists in store (not revoked)
     │                           Delete old refresh token
     │                           Issue new access + refresh tokens
     │                           Store new refresh token
     │                                      │
     │  { accessToken: newToken }           │
     │  Set-Cookie: refreshToken=newToken   │
     │ ◄────────────────────────────────── │
```

### Bcrypt Password Hashing

```
Signup:
  password "mypassword123"
       │
       ▼
  bcrypt.hash(password, 12)
       │
  12 salt rounds = 2^12 = 4096 iterations
       │
       ▼
  "$2a$12$XpKvF.g3y2SLr7cJBZcCzO..." (stored in DB)

Login:
  input password + stored hash
       │
       ▼
  bcrypt.compare(input, hash)  → true/false
```

### Role-Based Access Control

```
Roles: owner > editor > viewer

┌─────────────────────────────────────────┐
│ Action                │ Owner │ Editor │ Viewer │
├───────────────────────┼───────┼────────┼────────┤
│ View files/chat       │  ✅   │   ✅   │   ✅   │
│ Edit code             │  ✅   │   ✅   │   ❌   │
│ Create/delete files   │  ✅   │   ✅   │   ❌   │
│ Execute code          │  ✅   │   ✅   │   ❌   │
│ Send chat messages    │  ✅   │   ✅   │   ✅   │
│ Change member roles   │  ✅   │   ❌   │   ❌   │
│ Delete room           │  ✅   │   ❌   │   ❌   │
└─────────────────────────────────────────┘

Enforced at:
  - REST endpoint level (controller checks role)
  - WebSocket level (socket.currentRole check)
  - Frontend level (UI hides controls)
```

### Security Headers (Helmet.js)

```
Content-Security-Policy: default-src 'self'
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=15552000
X-XSS-Protection: 0
Referrer-Policy: no-referrer
```

---

## 10. Real-Time Collaboration (CRDT / Yjs)

### What is a CRDT?

CRDT stands for **Conflict-free Replicated Data Type**. It's a data structure that can be updated independently by multiple users concurrently and then merged without conflicts.

Without CRDT — naive "last write wins":
```
User A types "Hello"  → server receives "Hello"
User B types "World"  → server receives "World"
Result: "World" (A's edit is lost!)
```

With Yjs CRDT:
```
User A types "Hello"  → Yjs generates delta_A
User B types "World"  → Yjs generates delta_B
Both deltas applied   → Result: "HelloWorld" (both edits preserved!)
```

### How Yjs Works in CollabCode

```
┌─────────────────────────────────────────────────────┐
│                  CollabEditor.jsx                    │
│                                                       │
│  const ydoc = new Y.Doc()          ← Yjs document   │
│  const ytext = ydoc.getText()      ← Shared text     │
│                                                       │
│  MonacoBinding(ytext, editor.getModel())             │
│  ↑ This binds Monaco's model to Yjs text             │
│    Any Monaco edit → Yjs update                      │
│    Any Yjs update → Monaco edit                      │
│                                                       │
│  ydoc.on('update', (update) => {                     │
│    // Convert binary update to base64                 │
│    const delta = btoa(String.fromCharCode(...update))│
│    socket.emit('code_change', { fileId, delta })     │
│  })                                                   │
│                                                       │
│  // Incoming remote changes:                          │
│  registerCodeHandler(fileId, ({ delta }) => {        │
│    const binary = Uint8Array.from(atob(delta), ...)  │
│    Y.applyUpdate(ydoc, binary, 'remote')             │
│  })                                                   │
└─────────────────────────────────────────────────────┘
```

### Edit Propagation Flow

```
User A types "x" in Monaco Editor
         │
         ▼
MonacoBinding detects change → updates Y.Text
         │
         ▼
Y.Doc fires 'update' event with binary Yjs delta
         │
         ▼
delta encoded as base64 string
         │
         ▼
socket.emit('code_change', { fileId, delta, content })
         │
         ▼ (WebSocket)
Server receives code_change
         │
         ├── Broadcast to all OTHER users in room:
         │   socket.to(roomCode).emit('code_update', { delta, authorId })
         │
         └── Cache content in memory (debounced 5s save to MySQL)
                   │
         ▼ (on other user's browser)
Y.applyUpdate(ydoc, binaryDelta, 'remote')
         │
         ▼
MonacoBinding updates Monaco Editor model
         │
         ▼
User B sees User A's edit appear instantly
```

### Why Not Send Full Content Every Keystroke?

Sending the full document on every keystroke would be:
- **Wasteful** — 10KB file × 10 users × 100 keystrokes/min = 10MB/min
- **Slow** — large payloads = higher latency
- **Conflict-prone** — concurrent edits would overwrite each other

Yjs deltas are typically **< 50 bytes per keystroke** — just enough to describe what changed.

### Cursor Presence

```javascript
// Sent via volatile emit (can be dropped — cursors are non-critical)
socket.volatile.emit('cursor_move', {
  fileId,
  position: { lineNumber: 5, column: 12 },
  selection: { startLine: 5, startColumn: 8, endLine: 5, endColumn: 12 }
});

// Server broadcasts to others using volatile (best-effort delivery)
socket.to(roomCode).volatile.emit('cursor_update', {
  userId, username, avatarColor, fileId, position, selection
});

// Frontend renders remote cursors as Monaco decorations
editor.deltaDecorations([], [{
  range: new monaco.Range(lineNumber, column, lineNumber, column + 1),
  options: {
    beforeContentClassName: `remote-cursor-caret-${userId}`,
    after: { content: ` ${username} `, inlineClassName: 'remote-cursor-label' }
  }
}]);
```

---

## 11. Frontend Architecture

### Component Tree

```
App.jsx (Router + ThemeProvider + AuthProvider)
│
├── /login          → LoginPage.jsx
├── /signup         → SignupPage.jsx
├── /forgot-password → ForgotPasswordPage.jsx
├── /reset-password  → ResetPasswordPage.jsx
│
├── /dashboard      → DashboardPage.jsx
│   ├── Navbar.jsx
│   ├── RoomCard (inline)
│   ├── CreateRoomModal (inline)
│   └── JoinRoomModal (inline)
│
└── /room/:code     → RoomPage.jsx
    └── SocketProvider
        └── RoomLayout.jsx
            ├── [Header Bar]
            │   ├── ConnectionBadge.jsx
            │   └── PanelBtn (Members/Chat toggles)
            │
            ├── FileExplorer.jsx (left sidebar)
            │
            ├── CollabEditor.jsx (center - Monaco + Yjs)
            │
            ├── TerminalPanel.jsx (bottom - resizable)
            │
            └── [Right Sidebar - conditional]
                ├── ChatPanel.jsx
                └── MembersPanel.jsx
```

### Context Providers

```
ThemeProvider (dark/light mode, persisted to localStorage)
    └── AuthProvider (user state, login/logout)
            └── BrowserRouter
                    └── Routes
                            └── SocketProvider (per-room, created in RoomPage)
                                    └── Room components
```

### Data Flow in the Room

```
useRoom() hook (custom hook)
    │
    ├── Connects all socket events to local React state
    │   socket.on('room_state')     → setRoomState()
    │   socket.on('user_joined')    → setMembers()
    │   socket.on('code_update')    → calls registered handler
    │   socket.on('cursor_update')  → setCursors()
    │   socket.on('chat_broadcast') → setMessages()
    │   socket.on('execution_result') → setExecResult()
    │
    └── Returns state + action functions to RoomLayout
        { roomState, members, cursors, messages, execResult,
          sendMessage, sendCodeChange, sendCursorMove, runCode }
```

### Axios Token Refresh Interceptor

```
Every API request:
    │
    ├── Request interceptor:
    │   Add "Authorization: Bearer <accessToken>" header
    │
    ▼
    API call
    │
    ├── Response interceptor (on 401):
    │   ├── Is this a refresh call? No? → proceed
    │   ├── Set refreshing = true
    │   ├── POST /auth/refresh (uses httpOnly cookie)
    │   ├── Get new accessToken
    │   ├── Store in localStorage
    │   ├── Retry original request with new token
    │   └── If refresh also fails → redirect to /login
    │
    └── All other errors → pass through
```

---

## 12. State Management

CollabCode uses **React Context + custom hooks** for state. No Redux or Zustand — the data flow is simple enough that contexts are sufficient.

### State Distribution

```
┌─────────────────────────────────────────────────────┐
│ ThemeContext                                          │
│   theme: 'dark' | 'light'                           │
│   toggle: () => void                                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ AuthContext                                          │
│   user: { id, username, email, avatarColor }        │
│   loading: boolean                                   │
│   login(token, user): void                          │
│   logout(): void                                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ SocketContext                                        │
│   socket: Socket | null                             │
│   connected: boolean                                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ useRoom() (local state per room page)               │
│   roomState: { files, role }                        │
│   members: Member[]                                 │
│   cursors: { [userId]: CursorInfo }                 │
│   typingUsers: { userId, username }[]               │
│   messages: Message[]                               │
│   execResult: ExecutionResult | null                │
└─────────────────────────────────────────────────────┘
```

---

## 13. Code Execution Pipeline

### Judge0 Integration Flow

```
User clicks "Run"
      │
      ▼
socket.emit('run_code', { fileId, stdin })
      │
      ▼
Backend: socket/index.js handles 'run_code'
      │
      ├── Check role !== 'viewer'
      ├── Load file content from memory cache (or DB)
      └── Call executionService.runCode({ language, code, stdin })
                │
                ▼
         Judge0 Language ID lookup
         javascript → 93 (Node.js 18)
         python     → 71 (Python 3.8)
         java       → 62 (Java 11)
         etc.
                │
                ▼
         POST https://judge0-ce.p.rapidapi.com/submissions
         { source_code, language_id, stdin, cpu_time_limit: 10 }
                │
                ▼
         Receive { token } (submission token)
                │
                ▼
         Poll GET /submissions/:token every 1 second
                │
                ▼ (status.id > 2 = finished)
         { stdout, stderr, status, time }
                │
                ▼
Backend: Save to executions table
                │
                ▼
io.to(roomCode).emit('execution_result', {
  stdout, stderr, status, execTimeMs, triggeredBy
})
                │
                ▼
All users in room see the output in TerminalPanel
```

### Execution Status Codes (Judge0)
| ID | Status | Meaning |
|----|--------|---------|
| 1 | Queued | Waiting in queue |
| 2 | Processing | Currently running |
| 3 | Accepted | Ran successfully |
| 4 | Wrong Answer | Output didn't match |
| 5 | Time Limit Exceeded | Took too long |
| 6 | Compilation Error | Code has syntax errors |
| 11 | Runtime Error | Crashed during execution |

### Mock Execution (Dev mode)

When `JUDGE0_API_KEY` is not set, the service returns a mock response:
```json
{
  "stdout": "[Mock output for javascript]\nconsole.log(rohit)",
  "stderr": "",
  "status": "Accepted",
  "execTimeMs": 42
}
```

---

## 14. Email Service

### Forgot Password Flow

```
User enters email on /forgot-password
        │
        ▼
POST /api/auth/forgot-password { email }
        │
        ├── Find user by email (if not found, still return 200 — security)
        ├── Generate 32-byte random hex token (crypto.randomBytes(32))
        ├── Store token in memory Map: token → { userId, expiresAt: +1hr }
        ├── Build reset URL: CLIENT_URL/reset-password?token=xxx
        ├── Log URL to server logs (always, for debugging)
        └── Send email via Resend HTTP API (async, non-blocking)
                │
                ▼
        Return 200 immediately (don't wait for email)

User receives email → clicks "Reset Password"
        │
        ▼
GET /api/auth/verify-reset-token?token=xxx
        │
        ├── Check token exists in Map
        └── Check not expired → return { valid: true }

User enters new password
        │
        ▼
POST /api/auth/reset-password { token, password }
        │
        ├── Verify token valid + not expired
        ├── Find user by token's userId
        ├── bcrypt.hash(newPassword, 12)
        ├── user.update({ password_hash })
        └── Delete token from Map (single-use)
                │
                ▼
        { message: "Password reset successfully" }
        Frontend redirects to /login after 3 seconds
```

### Resend HTTP API Integration

CollabCode uses Resend's REST API directly (no SMTP) because Railway blocks outbound SMTP ports. The `emailService.js` makes a raw HTTPS request to `api.resend.com/emails` — no additional npm package needed.

---

## 15. Deployment Architecture

### Production Topology

```
                    ┌──────────────────┐
                    │   GitHub Repo    │
                    │  (Source of Truth)│
                    └────────┬─────────┘
                             │ git push
                    ┌────────▼──────────────────────────┐
                    │         GitHub Actions CI          │
                    │  lint + test + docker build check  │
                    └────────┬──────────────────────────┘
                             │
               ┌─────────────┴──────────────────┐
               │                                │
       ┌───────▼──────┐                 ┌───────▼──────┐
       │   Railway    │                 │    Vercel    │
       │  (Backend)   │                 │  (Frontend)  │
       │              │                 │              │
       │  Node.js app │                 │  Static React│
       │  port 4000   │◄───HTTPS/WS────►│  + CDN edge  │
       │              │                 │              │
       │  MySQL 8.0   │                 └──────────────┘
       │  (managed)   │
       └──────────────┘
              │
              │ HTTPS
    ┌─────────┴──────────┐
    │                    │
┌───▼────┐         ┌─────▼──────┐
│ Resend │         │  Judge0    │
│ (Email)│         │ (Execute)  │
└────────┘         └────────────┘
```

### Environment Variables

**Backend (Railway):**
```
NODE_ENV=production
PORT=4000
DB_HOST=mysql.railway.internal
DB_PORT=3306
DB_NAME=railway
DB_USER=root
DB_PASSWORD=<secret>
DB_SSL=false
REDIS_DISABLED=true
JWT_ACCESS_SECRET=<64-char hex>
JWT_REFRESH_SECRET=<64-char hex>
CLIENT_URL=https://collab-code-real-time-collaborative.vercel.app
JUDGE0_API_KEY=<rapidapi key>
RESEND_API_KEY=<re_xxx>
LOG_LEVEL=info
```

**Frontend (Vercel):**
```
VITE_API_URL=https://collabcode-real-time-collaborative-coding-platfo-production.up.railway.app
```

### CI/CD Pipeline (GitHub Actions)

```
On push to main:
    │
    ├── backend job:
    │   ├── Spin up MySQL + Redis services
    │   ├── npm install
    │   ├── npm run lint
    │   └── npm test (Jest + Supertest)
    │
    ├── frontend job:
    │   ├── npm install
    │   ├── npm run lint
    │   └── npm run build (Vite)
    │
    └── docker job (after backend + frontend pass):
        ├── Copy .env.example → .env
        └── docker compose build --no-cache
```

---

## 16. Data Flow Diagrams

### Signup Flow

```
Browser                    Express                    MySQL
   │                          │                         │
   │  POST /auth/signup        │                         │
   │ ─────────────────────────►│                         │
   │                          │                         │
   │                          │  User.findOne({email})  │
   │                          │ ────────────────────────►
   │                          │       null (not found)  │
   │                          │ ◄────────────────────────
   │                          │                         │
   │                          │  bcrypt.hash(password)  │
   │                          │                         │
   │                          │  User.create({...})     │
   │                          │ ────────────────────────►
   │                          │       user row created  │
   │                          │ ◄────────────────────────
   │                          │                         │
   │                          │  signAccessToken()      │
   │                          │  signRefreshToken()     │
   │                          │  tokenStore.setex()     │
   │                          │                         │
   │  { accessToken, user }   │                         │
   │  Set-Cookie: refreshToken│                         │
   │ ◄─────────────────────────                         │
```

### Real-Time Edit Flow

```
User A (Browser)        Server           User B (Browser)
      │                    │                    │
      │ Types "x"          │                    │
      │                    │                    │
      │ Yjs delta created  │                    │
      │                    │                    │
      │ socket.emit        │                    │
      │ ('code_change',    │                    │
      │  { delta })        │                    │
      │ ──────────────────►│                    │
      │                    │                    │
      │                    │ Cache content      │
      │                    │ in memory          │
      │                    │                    │
      │                    │ socket.to(room)    │
      │                    │ .emit('code_update'│
      │                    │ ──────────────────►│
      │                    │                    │
      │                    │                    │ Y.applyUpdate()
      │                    │                    │ Monaco updates
      │                    │                    │ User B sees "x"
```

### Auto-Save Flow

```
User edits code
      │
      ▼
Content cached in memory (roomState.js)
      │
      ▼
scheduleSave(roomCode, fileId, content) called
      │
      ▼
Previous timer cancelled (debounce)
      │
      ▼
New 5-second timer set
      │
      [5 seconds of no edits pass]
      │
      ▼
Timer fires:
  1. Create FileVersion snapshot (old content)
  2. file.update({ content, updated_at })
  3. Log "Auto-saved file"
```

---

## 17. Security Checklist

| Check | Status | Implementation |
|-------|--------|----------------|
| Passwords hashed with bcrypt ≥ cost 10 | ✅ | bcrypt cost factor 12 |
| JWT access tokens short-lived | ✅ | 15 minutes |
| Refresh tokens rotated on use | ✅ | Old token deleted, new one issued |
| Refresh tokens stored HTTP-only cookie | ✅ | `httpOnly: true, sameSite: strict` |
| WebSocket connections authenticated | ✅ | socketAuth middleware |
| Role checks server-side | ✅ | Controller + socket handler level |
| Code execution sandboxed | ✅ | Judge0 isolated containers |
| Rate limiting on auth endpoints | ✅ | 20 req/15min |
| Rate limiting on execution | ✅ | 10 req/min |
| Parameterized queries (no SQL injection) | ✅ | Sequelize ORM |
| Input validation + sanitization | ✅ | express-validator |
| CORS scoped to frontend origin | ✅ | CLIENT_URL env var |
| Security headers | ✅ | helmet.js |
| Password reset tokens single-use | ✅ | Deleted after use |
| Password reset tokens expire | ✅ | 1 hour TTL |
| Secrets never committed to git | ✅ | .gitignore covers .env |

---

## 18. Performance Design

### Latency Optimization Strategies

**1. Delta-only updates (not full document)**
Each keystroke sends a tiny Yjs binary delta (~20-50 bytes) instead of the full document content. This reduces WebSocket payload by 99%+ for large files.

**2. Volatile cursor updates**
```javascript
socket.to(room).volatile.emit('cursor_update', data)
// "volatile" = drop packet if network is busy
// Cursors are non-critical — a missed update just means
// the cursor position is slightly stale for < 100ms
```

**3. Debounced database writes**
```
Every keystroke → memory cache update (instant)
Every 5 seconds → MySQL write (batched)

Without debounce: 100 keystrokes/min × 10 users = 1000 DB writes/min
With debounce:    1 DB write per active file every 5 seconds
```

**4. Redis content cache (optional)**
When Redis is enabled, file content is cached in Redis instead of memory — allows multiple backend instances to share state (horizontal scaling).

**5. Connection state recovery (Socket.IO)**
```javascript
connectionStateRecovery: {
  maxDisconnectionDuration: 2 * 60 * 1000 // 2 minutes
}
// If user disconnects briefly, Socket.IO replays
// missed events on reconnect — no manual sync needed
```

### Database Indexing Strategy

```sql
-- Indexed columns for fast lookups:
rooms:        room_code (unique), owner_id, last_active_at
room_members: (room_id, user_id) unique, user_id
files:        room_id
file_versions: file_id
executions:   room_id
messages:     room_id
```

---

## 19. Glossary

| Term | Definition |
|------|-----------|
| **CRDT** | Conflict-free Replicated Data Type — a data structure that supports concurrent updates without conflicts |
| **Yjs** | A JavaScript CRDT library used for real-time collaborative editing |
| **Delta** | A small binary update describing what changed in a Yjs document (much smaller than the full document) |
| **Socket.IO** | A library that enables real-time bidirectional communication between browser and server over WebSockets |
| **JWT** | JSON Web Token — a signed token encoding user identity, used for stateless authentication |
| **Access Token** | Short-lived JWT (15 min) sent in HTTP Authorization header for API requests |
| **Refresh Token** | Long-lived token (7 days) stored in an httpOnly cookie, used to get new access tokens |
| **httpOnly Cookie** | A browser cookie that cannot be read by JavaScript — protects against XSS attacks |
| **bcrypt** | A password hashing function with a configurable cost factor that makes brute-force attacks slow |
| **ORM** | Object-Relational Mapper — Sequelize maps JavaScript objects to MySQL tables |
| **Room** | A collaborative session in CollabCode identified by a unique 8-character code |
| **Room Code** | A random 8-character alphanumeric ID used to share/join a room (e.g. `NIDKUF3C`) |
| **Role** | A user's permission level in a room: `owner`, `editor`, or `viewer` |
| **Monaco Editor** | The code editor that powers VS Code, embedded in the browser via `@monaco-editor/react` |
| **Judge0** | An open-source code execution API that runs code in isolated containers |
| **Resend** | A transactional email API service used to send password reset emails |
| **Rate Limiting** | Restricting how many requests a client can make in a time window to prevent abuse |
| **Volatile Emit** | A Socket.IO emit that can be dropped if the network is congested — used for cursor updates |
| **Debounce** | Delaying an action until a pause in activity — used to batch DB writes after typing stops |
| **Sequelize** | A Node.js ORM that provides a JavaScript API for MySQL (and other SQL databases) |
| **Vite** | A fast frontend build tool and dev server that uses native ES modules |
| **TailwindCSS** | A utility-first CSS framework where styles are applied via class names |
| **Railway** | A cloud platform for deploying backend services and managed databases |
| **Vercel** | A frontend hosting platform with global CDN and automatic deployments from GitHub |
| **Nixpacks** | Railway's build system that auto-detects project type and installs dependencies |
| **CI/CD** | Continuous Integration / Continuous Deployment — automated testing and deployment on code push |

---

*Documentation generated for CollabCode v1.0 — September 2026*
