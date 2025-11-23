# vibe-message Platform

A complete Firebase Cloud Messaging–style notification platform with multi-tenant support, admin approval workflow, and external SDK integration.

## 🚀 Features

- **Multi-tenant Architecture**: Support for multiple apps with isolated credentials
- **Admin Approval Workflow**: Super admin can approve/ban users and set app limits
- **Push Notifications**: Send both display and silent push notifications
- **Web Push Integration**: Full Web Push API support with VAPID keys
- **JavaScript SDK**: Easy-to-use SDK for client-side integration
- **REST API**: Backend API for sending notifications from your server
- **Real-time Tracking**: Monitor notification delivery status and device management
- **Modern Stack**: Node.js + Express + PostgreSQL + React + TypeScript

## 📁 Project Structure

```
message/
├── server/          # Backend API (Node.js + Express + TypeScript)
├── frontend/        # Admin Panel + Landing (React + Vite + TypeScript)
└── sdk/             # External JavaScript SDK
```

## 🛠️ Zero to Hero Setup Guide

Follow these steps to set up the project from scratch.

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** (comes with Node.js)

---

### Step 1: Database Setup

1. Ensure PostgreSQL is running.
2. Create the database:

   ```bash
   # Using terminal
   createdb messagedb

   # OR using psql
   psql -c "CREATE DATABASE messagedb;"
   ```

---

### Step 2: Backend Setup

1. Navigate to the server directory:

   ```bash
   cd server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure Environment Variables:

   - Copy the example file:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and update the following:
     - `DATABASE_URL`: `postgresql://your_user:your_password@localhost:5432/messagedb`
     - `JWT_SECRET`: Generate a random string (e.g., `openssl rand -hex 32`)
     - `VAPID_KEYS`: Run `npx web-push generate-vapid-keys` and paste the output.

4. Initialize Database Schema:

   ```bash
   npm run db:setup
   ```

5. Start the Server:
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:3000`.

---

### Step 3: SDK Setup

The SDK needs to be built and linked locally so the frontend can use it.

1. Open a new terminal and navigate to the sdk directory:

   ```bash
   cd sdk
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the SDK:

   ```bash
   npm run build
   ```

4. Create a local link:
   ```bash
   npm link
   ```

---

### Step 4: Frontend Setup

1. Open a new terminal and navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Link the local SDK:

   ```bash
   npm link fcm-clone-sdk
   ```

   _Note: If you see type errors, you may need to restart your VS Code or TypeScript server._

4. Configure Environment Variables (Optional):

   ```bash
   cp .env.example .env
   ```

   Ensure `VITE_API_URL=http://localhost:3000/api`.

5. Start the Frontend:
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`.

---

## 📖 Usage Guide

### 1. Initial Login (Super Admin)

The system creates a default Super Admin account on the first run.

- **Email**: `admin@vibe-message.com` (or check `.env`)
- **Password**: `SuperAdmin@123` (or check `.env`)

### 2. Creating a New User

1. Go to `http://localhost:5173/signup`.
2. Create a new account.
3. **Important**: New accounts are `PENDING` by default.
4. Log in as Super Admin (`admin@fcmclone.com`).
5. Go to **Users** section and click **Approve** on the new user.

### 3. Creating an App

1. Log in with the approved user account.
2. Go to **Apps** -> **Create New App**.
3. Enter app details.
   serviceWorkerPath: '/push-sw.js'
   });
   ```

   ```

---

## 🔧 Troubleshooting

### SDK 404 Error (vapid-public-key)

- Ensure your SDK initialization URL has the `/api` suffix: `http://localhost:3000/api`.
- Ensure the backend server is running.

### Notifications Not Arriving

- Check if the user ID matches. If you register as `user_123`, send the notification to `user_123`.
- Check the browser console for "Notification permission denied".
- Ensure the Service Worker is registered correctly.

### "Profile" Page Redirects to Home

- This usually means the route is missing in `App.tsx`. We fixed this in the latest update.

---

## 🏗️ Architecture

### Backend

- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL (Raw SQL)
- **Auth**: JWT + bcrypt
- **Push**: `web-push` library

### Frontend

- **Framework**: React + Vite
- **Styling**: Tailwind CSS
- **State**: Context API

### SDK

- **Type**: Universal JavaScript Module (UMD/ESM)
- **Features**: Service Worker management, VAPID key handling

## 📝 License

MIT
