# ConnectHub — Real-Time Communication & Collaboration Platform

A production-grade, full-stack team collaboration platform inspired by **Slack** and **Discord**, built with **React**, **Node.js**, **Express**, **MongoDB Atlas / Mongoose**, and **Socket.IO**.

ConnectHub delivers persistent MongoDB-backed workspaces, channels, direct messaging, real-time presence, typing indicators, file sharing (Cloudinary with local disk fallback), and a lightweight Kanban task management system.

---

## ⚡ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios, Socket.IO Client, Lucide React, date-fns |
| **Backend** | Node.js (ESM), Express.js, Socket.IO v4, Mongoose ODM, JWT, bcryptjs, Cookie-Parser, Multer |
| **Database** | MongoDB (Full Mongoose schemas with validation, indexes, and relational refs) |
| **Media / Storage** | Cloudinary SDK with automatic local disk upload fallback |

---

## 🚀 Key Features

1. **Authentication & Session Security**
   - User registration & login with password hashing via `bcryptjs` (salt 10).
   - JWT-based authentication stored in secure HTTP-only cookies + Authorization header backup.
   - User profile customization (name, avatar, presence status, custom status emoji, bio).
   - One-click demo sign-ins for instant testing.

2. **Workspaces & Channels (Slack / Discord UI)**
   - Left-rail workspace selector with active indicators.
   - Public and private channels with lock badges and creator permissions.
   - Workspace member management: Owner, Admin, and Member roles.
   - Unique 8-character workspace invite codes for joining.

3. **Real-Time Communication (Socket.IO & MongoDB)**
   - Messages are saved directly to MongoDB before broadcasting.
   - Instant real-time delivery across separate browser windows or tabs.
   - Live typing indicators ("Sarah is typing...").
   - Online/offline presence indicators with real-time updates.
   - Message read receipts, pinned announcements, and emoji reactions (`👍`, `❤️`, `🔥`, `🚀`, `🎉`, `😂`).

4. **File Sharing & Cloud Storage**
   - Upload images and files in channels and direct messages.
   - Cloudinary integration with automatic fallback to local `/uploads` if credentials are not configured.
   - File metadata persistence in MongoDB (uploader, filename, filesize, timestamp).
   - Dedicated "Shared Files" tab in the right sidebar.

5. **Integrated Task Management (Kanban Board)**
   - Built-in workspace task management module.
   - Columns: **To Do**, **In Progress**, **In Review**, and **Completed**.
   - Priorities: **Urgent**, **High**, **Medium**, and **Low**.
   - Assign tasks to workspace members with due dates and completion checkboxes.
   - Persisted permanently in MongoDB.

---

## 🔑 Demo Credentials

When the database is seeded (`npm run seed`), the following accounts are ready to use:

| User | Email | Password | Role in Acme Corp |
| :--- | :--- | :--- | :--- |
| **Alex Turner** | `alex@connecthub.io` | `Password123!` | Owner |
| **Sarah Connor** | `sarah@connecthub.io` | `Password123!` | Admin |
| **David Kim** | `david@connecthub.io` | `Password123!` | Member |

> *Tip: The Login page also features **1-Click Demo Buttons** for Alex and Sarah.*

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v20+)
- **MongoDB** running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI

### 2. Installation
Install all dependencies for root, backend, and frontend:
```bash
npm run install:all
```

### 3. Environment Configuration
Check `backend/.env` (pre-configured with defaults):
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/connecthub
JWT_SECRET=connecthub_super_secret_jwt_key_2026_xyz_auth_token_secret!
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Optional: Cloudinary credentials (automatic local disk storage fallback if left blank)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 4. Seed Database
Seed sample users, workspaces (Acme Corp & Tech Innovators), channels, messages, and tasks:
```bash
npm run seed
```

### 5. Start Development Servers
Run backend and frontend concurrently:
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5001](http://localhost:5001)

---

## 🧪 Testing Multi-Window Real-Time Collaboration

Follow these steps to experience full real-time collaboration:

1. Open your browser and navigate to [http://localhost:5173](http://localhost:5173).
2. Click **"Alex Turner"** under Demo Credentials (or enter `alex@connecthub.io` / `Password123!`) to sign in.
3. Open an **Incognito / Private Window** (or a second browser) and navigate to [http://localhost:5173](http://localhost:5173).
4. Click **"Sarah Connor"** (or enter `sarah@connecthub.io` / `Password123!`) to sign in.
5. In both windows, ensure the **Acme Corp** workspace and **#general** channel are open:
   - Notice the green online status indicator next to both names in the right sidebar.
   - Start typing in Alex's window: Sarah's window immediately displays **"Alex Turner is typing..."**.
   - Send a message from Alex: it appears instantly in Sarah's window via Socket.IO without page refresh.
   - React with an emoji (e.g. `🔥`) from Sarah: the counter increments in real time in Alex's window.
   - Click the paperclip icon in Sarah's window and send an image or file: it immediately appears in the conversation and in the Right Sidebar's **Files** tab.
   - Switch to the **Workspace Tasks** tab in Alex's window, create a task assigned to Sarah, and change its status from "To Do" to "In Progress". Refresh both pages to verify complete MongoDB persistence.

---

## 🔬 Automated Test Suite

Run the full end-to-end verification suite:
```bash
npm test
```
The automated test verifies:
- Health check
- User registration & duplicate email rejection
- Password hashing & credential validation
- JWT cookie & Authorization header authentication
- Workspace & channel permissions
- MongoDB message persistence
- Emoji reaction & message pinning
- Task creation and status transition
- Simultaneous dual-client Socket.IO real-time message broadcasting
