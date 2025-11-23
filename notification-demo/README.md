# 🔔 Notification Demo App

A Next.js TypeScript demo application for testing push and in-app notifications with the Vibe Message service.

## Features

- ✅ Dynamic App ID and Secret Key configuration
- ✅ User ID management (self and other users)
- ✅ Self push notifications
- ✅ Self in-app notifications
- ✅ Other user push notifications
- ✅ Other user in-app notifications
- ✅ Real-time activity logs
- ✅ Beautiful, responsive UI

## Prerequisites

- Node.js 18+ installed
- Vibe Message backend server running (default: `http://localhost:3000`)
- An app created in the Vibe Message dashboard with App ID and Secret Key

## Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3001](http://localhost:3001) in your browser

## Usage

### 1. Configure Your App

- **Base URL**: Enter your Vibe Message backend URL (default: `http://localhost:3000`)
- **App ID**: Enter your public app ID from the Vibe Message dashboard
- **Secret Key**: Enter your secret key from the Vibe Message dashboard
- **Your User ID**: Enter a unique user ID for yourself (e.g., `user-1`)
- **Other User ID**: Enter a different user ID to test cross-user notifications (e.g., `user-2`)

### 2. Register Device

Click the **"Register Device"** button to:

- Request browser notification permissions
- Register your device with the Vibe Message service
- Enable push notification reception

### 3. Test Notifications

#### Self Notifications

- **Self Push Notification**: Sends a push notification to yourself (works even when tab is closed)
- **Self In-App Notification**: Shows a browser notification immediately (tab must be open)

#### Other User Notifications

- **Send Push to Other User**: Sends a push notification to another user ID
- **Send In-App to Other User**: Info message (in-app notifications are local only)

### 4. Test Cross-User Notifications

To test notifications between users:

1. Open the app in **two browser windows** (or two different browsers)
2. In **Window 1**: Set User ID to `user-1` and register
3. In **Window 2**: Set User ID to `user-2` and register
4. In **Window 1**: Click "Send Push to Other User" (with Other User ID = `user-2`)
5. **Window 2** will receive the push notification!

## How It Works

### Push Notifications

- Uses the Vibe Message SDK to register devices
- Sends notifications via the backend API (`/api/push/send`)
- Works even when the browser tab is closed
- Handled by the service worker (`/push-sw.js`)

### In-App Notifications

- Uses the browser's Notification API
- Only works when the tab is open
- Displayed immediately without backend involvement

## Project Structure

```
notification-demo/
├── app/
│   ├── page.tsx          # Main demo page with UI and logic
│   └── layout.tsx        # Root layout
├── public/
│   └── push-sw.js        # Service worker for push notifications
├── package.json
└── README.md
```

## Troubleshooting

### Notifications Not Working

1. **Check browser permissions**: Ensure notifications are allowed in browser settings
2. **Verify backend is running**: Make sure the Vibe Message server is accessible
3. **Check App ID and Secret Key**: Ensure they match your app in the dashboard
4. **Check console logs**: Open browser DevTools to see error messages

### Service Worker Issues

1. **Clear service workers**: Go to DevTools > Application > Service Workers > Unregister
2. **Hard refresh**: Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)
3. **Check HTTPS**: Service workers require HTTPS in production (localhost works in development)

## API Endpoints Used

- `POST /api/push/send` - Send push notifications
  ```json
  {
    "appId": "your-app-id",
    "secretKey": "your-secret-key",
    "notification": {
      "title": "Title",
      "body": "Message",
      "icon": "/icon.png",
      "click_action": "/"
    },
    "targets": {
      "externalUserIds": ["user-1"]
    }
  }
  ```

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vibe Message SDK** - Notification client
- **Service Workers** - Push notification handling

## License

MIT
