# PostgreSQL Connection Troubleshooting

The error `password authentication failed for user "umang"` means the password in your DATABASE_URL doesn't match your PostgreSQL user password.

## Solution Options

### Option 1: Update .env with Correct Password

Edit `server/.env` and update the DATABASE_URL with your actual PostgreSQL password:

```env
DATABASE_URL=postgresql://umang:YOUR_ACTUAL_PASSWORD@localhost:5432/messagedb
```

Replace `YOUR_ACTUAL_PASSWORD` with the actual password for the PostgreSQL user `umang`.

### Option 2: Find Your PostgreSQL Password

If you don't remember the password:

**Windows:**
1. Open pgAdmin 4
2. Right-click on the server → Properties
3. Or reset the password using pgAdmin

**Command Line (if you have admin access):**
```bash
# Connect as postgres superuser
psql -U postgres

# Change password for umang
ALTER USER umang WITH PASSWORD 'your_new_password';
```

### Option 3: Use Different PostgreSQL User

If you want to use the default `postgres` user instead:

1. Edit `server/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/messagedb
   ```

2. Create the database as postgres user:
   ```bash
   psql -U postgres -c "CREATE DATABASE messagedb;"
   ```

## Quick Test

Test your connection string:
```bash
# Replace with your actual credentials
psql "postgresql://umang:YOUR_PASSWORD@localhost:5432/messagedb"
```

If this works, the same credentials will work in the .env file.

## After Fixing

Once you've updated the password in `server/.env`:

```bash
cd server
npm run db:setup
npm run dev
```
