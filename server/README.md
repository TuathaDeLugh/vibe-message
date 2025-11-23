# Vibe Message Server

Backend server for the FCM-style notification platform.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Generate VAPID keys:**

   ```bash
   npx web-push generate-vapid-keys
   ```

3. **Configure environment:**

   - Copy `.env.example` to `.env`
   - Update all environment variables, especially:
     - `DATABASE_URL`
     - `JWT_SECRET`
     - `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`
     - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

4. **Setup database:**

   ```bash
   npm run db:setup
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /auth/signup` - Register new admin
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user

### Super Admin

- `GET /admin/users` - List users
- `PATCH /admin/users/:id/status` - Update user status
- `PATCH /admin/users/:id/app-limit` - Set app limit
- `POST /admin/users/:id/warn` - Create warning

### Apps

- `GET /apps` - List apps
- `POST /apps` - Create app
- `GET /apps/:id` - Get app details
- `PATCH /apps/:id` - Update app
- `POST /apps/:id/rotate-secret` - Rotate secret key
- `DELETE /apps/:id` - Delete app

### SDK Integration

- `GET /sdk/vapid-public-key` - Get VAPID public key
- `POST /sdk/register-device` - Register device
- `POST /sdk/unregister-device` - Unregister device

### Push Notifications

- `POST /api/push/send` - Send push notification

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:setup` - Setup database schema
