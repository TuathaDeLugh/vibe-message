# Vibe Message SDK

Lightweight JavaScript SDK for web push notifications - A modern Firebase Cloud Messaging alternative.

## Installation

```bash
npm install vibe-message
```

## Usage

### 1. Create a Service Worker

Create a file `public/push-sw.js`:

```javascript
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  if (data.silent) {
    // Handle silent notification
    return;
  }
  
  const title = data.title || 'Notification';
  const options = {
    body: data.body,
    icon: data.icon,
    image: data.image,
    data: { click_action: data.click_action }
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.click_action || '/';
  event.waitUntil(clients.openWindow(url));
});
```

### 2. Initialize SDK

```javascript
import { initNotificationClient } from 'vibe-message';

const client = initNotificationClient({
  baseUrl: 'https://your-backend.com/api',
  appId: 'your-app-id',
  publicKey: 'your-public-key'
});
```

### 3. Register Device

```javascript
// When user logs in
await client.registerDevice({
  externalUserId: 'user-123',
  serviceWorkerPath: '/push-sw.js' // optional, defaults to '/push-sw.js'
});
```

### 4. Listen for Messages

```javascript
// Foreground messages (when app is visible)
client.onMessage((payload) => {
  console.log('Message received:', payload);
  // Show in-app notification
});

// Background messages (when notification is clicked)
client.onBackgroundMessage((payload) => {
  console.log('Notification clicked:', payload);
});

// Silent messages (no UI)
client.onSilentMessage((data) => {
  console.log('Silent message:', data);
});
```

### 5. Unregister Device

```javascript
// When user logs out
await client.unregisterDevice('user-123');
```

## API Reference

### `initNotificationClient(options)`

Initialize the notification client.

**Parameters:**
- `options.baseUrl` (string): Base URL of your backend API
- `options.appId` (string): Your app ID from the admin panel
- `options.publicKey` (string): Your app's public key

**Returns:** `NotificationClient`

### `client.registerDevice(options)`

Register a device for push notifications.

**Parameters:**
- `options.externalUserId` (string): Your app's user ID
- `options.serviceWorkerPath` (string, optional): Path to service worker file

**Returns:** `Promise<void>`

### `client.unregisterDevice(externalUserId)`

Unregister a device from push notifications.

**Parameters:**
- `externalUserId` (string): Your app's user ID

**Returns:** `Promise<void>`

### `client.onMessage(callback)`

Register a callback for foreground messages.

**Parameters:**
- `callback` (function): Function to handle message payload

### `client.onBackgroundMessage(callback)`

Register a callback for background messages (notification clicks).

**Parameters:**
- `callback` (function): Function to handle message payload

### `client.onSilentMessage(callback)`

Register a callback for silent messages.

**Parameters:**
- `callback` (function): Function to handle message data

## Features

- 🚀 **Lightweight** - Minimal dependencies, small bundle size
- 🔒 **Secure** - VAPID authentication, encrypted push
- 📱 **Cross-platform** - Works on all modern browsers
- 🎯 **Type-safe** - Full TypeScript support
- 🔄 **Background sync** - Receive notifications when app is closed
- 🎨 **Customizable** - Full control over notification appearance

## Browser Support

- Chrome/Edge 50+
- Firefox 44+
- Safari 16+ (macOS 13+, iOS 16.4+)
- Opera 37+

## License

MIT

