# Environment Setup Guide

## Quick Setup

I've configured your environment with the PostgreSQL connection you provided. Follow these steps:

### 1. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Run the environment setup script (already creates .env with your DB URL)
node src/scripts/setupEnv.js

# Generate VAPID keys
npx web-push generate-vapid-keys

# Copy the output and manually edit server/.env:
# - Replace VAPID_PUBLIC_KEY with the Public Key
# - Replace VAPID_PRIVATE_KEY with the Private Key

# Setup database
npm run db:setup

# Start server
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:3000" > .env

# Start dev server
npm run dev
```

### 3. SDK Setup

```bash
cd sdk

# Install dependencies
npm install

# Build SDK
npm run build
```

## Configuration Details

### Backend (.env)

Your backend `.env` has been configured with:

- **Database URL**: `postgresql://umang:secret123@localhost:5432/message-db`
- **JWT Secret**: Auto-generated secure random string
- **Super Admin Email**: `admin@fcmclone.com`
- **Super Admin Password**: `SuperAdmin@123`
- **Port**: `3000`
- **VAPID Keys**: You need to add these manually (see step 1 above)

### Frontend (.env)

- **API URL**: `http://localhost:3000`

### Important Notes

1. **VAPID Keys**: You MUST generate and add VAPID keys to `server/.env` before starting the server
2. **Database**: Make sure PostgreSQL is running and the database `message-db` exists
3. **Super Admin**: The super admin account will be created automatically on first server start

## Creating the Database

If the database doesn't exist yet, create it:

```bash
# Using psql
psql -U umang -h localhost -p 5432 -c "CREATE DATABASE messagedb;"

# Or using pgAdmin or any PostgreSQL client
```

## Verification

After setup, verify everything works:

1. Backend should be running on `http://localhost:3000`
2. Frontend should be running on `http://localhost:5173`
3. Visit `http://localhost:5173` to see the landing page
4. Login with super admin credentials to approve users

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check the database exists: `psql -U umang -l`
- Verify credentials are correct

### VAPID Key Error
- Make sure you've run `npx web-push generate-vapid-keys`
- Ensure both public and private keys are in `.env`
- Keys should not have quotes around them

### Port Already in Use
- Change `PORT` in `server/.env` to another port (e.g., 3001)
- Update `VITE_API_URL` in `frontend/.env` accordingly
