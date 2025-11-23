# Vibe Message Frontend

React + Vite + TypeScript admin panel and landing page for Vibe Message platform.

## Features

- **Public Landing Page**: Marketing page with features and CTAs
- **Documentation**: Comprehensive integration guide
- **Authentication**: Signup, login, and JWT-based auth
- **Admin Dashboard**: App management and statistics
- **Super Admin Panel**: User approval and management
- **Responsive Design**: Tailwind CSS with modern styling

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment (optional):

   ```bash
   cp .env.example .env
   ```

3. Start development server:

   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Environment Variables

- `VITE_API_URL`: Backend API URL (default: http://localhost:3000)

## Pages

### Public

- `/` - Landing page
- `/docs` - Documentation
- `/login` - Login page
- `/signup` - Signup page

### Authenticated

- `/dashboard` - Dashboard overview
- `/apps` - App list and creation
- `/apps/:id` - App details and credentials
- `/pending` - Pending approval page

### Super Admin

- `/super/users` - User management

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router v6
- Tailwind CSS
- Axios
