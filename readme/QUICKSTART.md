# 🚀 Quick Start Reference

## ✅ Your Configuration

**Database**: `postgresql://umang:secret123@localhost:5432/messagedb`  
**Super Admin**: `admin@fcmclone.com` / `SuperAdmin@123`

---

## 📝 One-Time Setup

### 1. Generate VAPID Keys
```bash
cd server
npm install
npx web-push generate-vapid-keys
```

Copy the output and edit `server/.env`:
- Replace `YOUR_VAPID_PUBLIC_KEY_HERE` with the Public Key
- Replace `YOUR_VAPID_PRIVATE_KEY_HERE` with the Private Key

### 2. Setup Database
```bash
cd server
npm run db:setup
```

### 3. Install Frontend Dependencies
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:3000" > .env
```

---

## 🏃 Daily Development

### Start Backend
```bash
cd server
npm run dev
```
→ Runs on http://localhost:3000

### Start Frontend (in another terminal)
```bash
cd frontend
npm run dev
```
→ Runs on http://localhost:5173

---

## 🔑 First Login

1. Visit http://localhost:5173
2. Login with:
   - Email: `admin@fcmclone.com`
   - Password: `SuperAdmin@123`

---

## 📦 File Locations

- Backend `.env`: `server/.env`
- Frontend `.env`: `frontend/.env`
- Database Schema: `server/sql/schema.sql`
- Setup Script: `server/src/scripts/setupEnv.js`

---

## ⚡ Quick Commands

```bash
# Regenerate .env (if needed)
node server/src/scripts/setupEnv.js

# Reset database
cd server && npm run db:setup

# Build SDK
cd sdk && npm install && npm run build

# View logs
cd server && npm run dev  # Shows all API requests
```

---

## 🆘 Common Issues

**"Cannot connect to database"**
→ Make sure PostgreSQL is running and database `messagedb` exists

**"VAPID keys not configured"**
→ Run `npx web-push generate-vapid-keys` and add keys to `server/.env`

**"Port already in use"**
→ Change `PORT` in `server/.env` and `VITE_API_URL` in `frontend/.env`

---

## 📚 Full Documentation

- [ENV_SETUP.md](./ENV_SETUP.md) - Detailed environment setup
- [SETUP.md](./SETUP.md) - Complete setup guide
- [README.md](./README.md) - Project overview
- [walkthrough.md](./.gemini/antigravity/brain/.../walkthrough.md) - Implementation details
