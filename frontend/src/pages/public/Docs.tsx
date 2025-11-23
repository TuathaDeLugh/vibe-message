import React, { useState } from "react";

export const Docs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"basic" | "react" | "nextjs">(
    "basic"
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Documentation</h1>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("basic")}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === "basic"
              ? "text-primary-600 border-b-2 border-primary-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Basic Setup
        </button>
        <button
          onClick={() => setActiveTab("react")}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === "react"
              ? "text-primary-600 border-b-2 border-primary-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          React Integration
        </button>
        <button
          onClick={() => setActiveTab("nextjs")}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === "nextjs"
              ? "text-primary-600 border-b-2 border-primary-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Next.js Integration
        </button>
      </div>

      {/* Basic Setup Tab */}
      {activeTab === "basic" && (
        <div>
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Follow these steps to integrate push notifications into your web
                application:
              </p>

              <div className="card">
                <h3 className="font-semibold text-lg mb-2">
                  1. Create an Account
                </h3>
                <p>
                  Sign up on our platform and wait for super admin approval.
                </p>
              </div>

              <div className="card">
                <h3 className="font-semibold text-lg mb-2">2. Create an App</h3>
                <p>
                  Once approved, create an app to receive your{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded">appId</code>,{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    publicKey
                  </code>
                  , and{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    secretKey
                  </code>
                  .
                </p>
              </div>

              <div className="card">
                <h3 className="font-semibold text-lg mb-2">
                  3. Setup Service Worker
                </h3>
                <p>
                  Create a service worker file (
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    push-sw.js
                  </code>
                  ) in your public directory:
                </p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mt-2">
                  {`self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  
  if (data.silent) {
    // Handle silent notification
    console.log('Silent push received:', data);
    return;
  }
  
  const { title, body, icon, image, click_action } = data;
  
  event.waitUntil(
    self.registration.showNotification(title || 'Notification', {
      body,
      icon,
      image,
      data: { click_action }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.click_action || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});`}
                </pre>
              </div>

              <div className="card">
                <h3 className="font-semibold text-lg mb-2">4. Install SDK</h3>
                <p>
                  Install the SDK in your project (use local build for now):
                </p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mt-2">
                  {`# Copy the SDK from your project
cp -r path/to/sdk/dist your-project/lib/sdk`}
                </pre>
              </div>

              <div className="card">
                <h3 className="font-semibold text-lg mb-2">
                  5. Initialize SDK
                </h3>
                <p>In your application code:</p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mt-2">
                  {`import { initNotificationClient } from './lib/sdk';

const client = initNotificationClient({
  baseUrl: 'http://localhost:3000/api',
  appId: 'your-app-id',
  publicKey: 'your-public-key'
});

// Register device when user logs in
await client.registerDevice({
  externalUserId: 'user-123',
  serviceWorkerPath: '/push-sw.js'
});`}
                </pre>
              </div>

              <div className="card">
                <h3 className="font-semibold text-lg mb-2">
                  6. Send Notifications from Backend
                </h3>
                <p>Call the push API from your server:</p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mt-2">
                  {`const response = await fetch('http://localhost:3000/api/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    appId: 'your-app-id',
    secretKey: 'your-secret-key',
    notification: {
      title: 'Hello!',
      body: 'This is a test notification',
      icon: '/icon.png',
      image: '/banner.jpg',
      click_action: 'https://your-app.com/page',
      silent: false
    },
    targets: {
      externalUserIds: ['user-123'] // or { all: true }
    }
  })
});

const result = await response.json();
console.log(result);`}
                </pre>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">API Reference</h2>

            <div className="card mb-4">
              <h3 className="font-semibold text-lg mb-2">
                POST /api/push/send
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Send a push notification to devices
              </p>
              <div className="text-sm">
                <p className="font-medium mb-1">Request Body:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>
                    <code className="bg-gray-100 px-1">appId</code> (string) -
                    Your app ID
                  </li>
                  <li>
                    <code className="bg-gray-100 px-1">secretKey</code> (string)
                    - Your secret key
                  </li>
                  <li>
                    <code className="bg-gray-100 px-1">notification</code>{" "}
                    (object) - Notification payload
                  </li>
                  <li>
                    <code className="bg-gray-100 px-1">targets</code> (object,
                    optional) - Target users
                  </li>
                </ul>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-lg mb-2">
                Notification Object
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>
                  <code className="bg-gray-100 px-1">title</code> (string,
                  required) - Notification title
                </li>
                <li>
                  <code className="bg-gray-100 px-1">body</code> (string,
                  optional) - Notification body
                </li>
                <li>
                  <code className="bg-gray-100 px-1">icon</code> (string,
                  optional) - Icon URL
                </li>
                <li>
                  <code className="bg-gray-100 px-1">image</code> (string,
                  optional) - Image URL
                </li>
                <li>
                  <code className="bg-gray-100 px-1">click_action</code>{" "}
                  (string, optional) - URL to open on click
                </li>
                <li>
                  <code className="bg-gray-100 px-1">silent</code> (boolean,
                  optional) - Silent notification (no UI)
                </li>
                <li>
                  <code className="bg-gray-100 px-1">data</code> (object,
                  optional) - Custom data payload
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
            <div className="space-y-3 text-gray-700">
              <div className="card">
                <h3 className="font-semibold mb-2">🔒 Security</h3>
                <p>
                  Never expose your{" "}
                  <code className="bg-gray-100 px-1">secretKey</code> in
                  client-side code. Only use it on your backend server.
                </p>
              </div>
              <div className="card">
                <h3 className="font-semibold mb-2">📱 User Experience</h3>
                <p>
                  Always request notification permission at an appropriate time,
                  not immediately on page load.
                </p>
              </div>
              <div className="card">
                <h3 className="font-semibold mb-2">⚡ Performance</h3>
                <p>
                  Use silent notifications for background data sync to avoid
                  overwhelming users with UI notifications.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* React Integration Tab */}
      {activeTab === "react" && (
        <div>
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">
              React Integration Guide
            </h2>
            <p className="text-gray-700 mb-6">
              Complete guide for integrating notifications in React applications
              (Vite, CRA, etc.)
            </p>

            <div className="card mb-6">
              <h3 className="font-semibold text-lg mb-3">
                1. Create Notification Context
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Create{" "}
                <code className="bg-gray-100 px-1">
                  src/context/NotificationContext.tsx
                </code>
                :
              </p>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {`import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { initNotificationClient } from '../lib/sdk';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'notification-registered';

interface NotificationContextType {
  isRegistered: boolean;
  permissionStatus: NotificationPermission;
  requestPermission: () => Promise<void>;
  unregisterNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const clientRef = useRef<any>(null);

  useEffect(() => {
    // Load registration state
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') setIsRegistered(true);
    
    // Check permission
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const initializeNotifications = async (userId: string) => {
    const client = initNotificationClient({
      baseUrl: 'http://localhost:3000/api',
      appId: 'your-app-id',
      publicKey: 'your-public-key'
    });

    clientRef.current = client;

    // Register callbacks
    client.onMessage((payload: any) => {
      toast.success(\`\${payload.title}: \${payload.body}\`);
    });

    // Register device
    await client.registerDevice({
      externalUserId: userId,
      serviceWorkerPath: '/push-sw.js'
    });

    setIsRegistered(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const requestPermission = async () => {
    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    
    if (permission === 'granted') {
      await initializeNotifications('user-id');
    }
  };

  const unregisterNotifications = async () => {
    if (clientRef.current) {
      await clientRef.current.unregisterDevice('user-id');
      setIsRegistered(false);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <NotificationContext.Provider value={{ isRegistered, permissionStatus, requestPermission, unregisterNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};`}
              </pre>
            </div>

            <div className="card mb-6">
              <h3 className="font-semibold text-lg mb-3">2. Wrap Your App</h3>
              <p className="text-sm text-gray-600 mb-3">
                In <code className="bg-gray-100 px-1">src/App.tsx</code>:
              </p>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {`import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <NotificationProvider>
      <Toaster position="top-right" />
      {/* Your app components */}
    </NotificationProvider>
  );
}`}
              </pre>
            </div>

            <div className="card mb-6">
              <h3 className="font-semibold text-lg mb-3">
                3. Use in Components
              </h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {`import { useNotifications } from '../context/NotificationContext';

function Dashboard() {
  const { isRegistered, permissionStatus, requestPermission } = useNotifications();

  return (
    <div>
      {permissionStatus === 'default' && (
        <button onClick={requestPermission}>
          Enable Notifications
        </button>
      )}
      {isRegistered && <p>✅ Notifications enabled!</p>}
    </div>
  );
}`}
              </pre>
            </div>

            <div className="card">
              <h3 className="font-semibold text-lg mb-3">
                4. Unregister on Logout
              </h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {`const { unregisterNotifications } = useNotifications();

const handleLogout = async () => {
  await unregisterNotifications();
  // Proceed with logout
};`}
              </pre>
            </div>
          </section>
        </div>
      )}

      {/* Next.js Integration Tab */}
      {activeTab === "nextjs" && (
        <div>
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">
              Next.js Integration Guide
            </h2>
            <p className="text-gray-700 mb-6">
              Complete guide for integrating notifications in Next.js App Router
              applications
            </p>

            <div className="card mb-6">
              <h3 className="font-semibold text-lg mb-3">
                1. Setup Service Worker
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Create{" "}
                <code className="bg-gray-100 px-1">public/push-sw.js</code>{" "}
                (same as basic setup)
              </p>
            </div>

            <div className="card mb-6">
              <h3 className="font-semibold text-lg mb-3">
                2. Create Client Component
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Create{" "}
                <code className="bg-gray-100 px-1">
                  app/components/NotificationManager.tsx
                </code>
                :
              </p>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {`"use client";

import { useState, useEffect, useRef } from 'react';
import { initNotificationClient } from 'vibe-message';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'notification-config';

export default function NotificationManager() {
  const [appId, setAppId] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [userId, setUserId] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const clientRef = useRef<any>(null);

  useEffect(() => {
    // Load config from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const config = JSON.parse(stored);
      setAppId(config.appId || '');
      setPublicKey(config.publicKey || '');
      setUserId(config.userId || '');
    }

    // Check permission status
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const saveConfig = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ appId, publicKey, userId }));
  };

  const registerDevice = async () => {
    try {
      const client = initNotificationClient({
        baseUrl: window.location.origin + '/api',
        appId,
        publicKey
      });

      clientRef.current = client;

      // Register callbacks
      client.onMessage((payload: any) => {
        toast.custom((t) => (
          <div className="bg-white shadow-lg rounded-lg p-4">
            <p className="font-medium">{payload.title}</p>
            <p className="text-sm text-gray-600">{payload.body}</p>
          </div>
        ));
      });

      // Request permission
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission !== 'granted') {
        toast.error('Notification permission denied');
        return;
      }

      // Register device
      await client.registerDevice({
        externalUserId: userId,
        serviceWorkerPath: '/push-sw.js'
      });

      setIsRegistered(true);
      saveConfig();
      toast.success('Notifications enabled!');
    } catch (error: any) {
      toast.error(\`Failed: \${error.message}\`);
    }
  };

  const unregisterDevice = async () => {
    if (clientRef.current) {
      await clientRef.current.unregisterDevice(userId);
      setIsRegistered(false);
      toast.success('Notifications disabled');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Notification Demo</h1>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">App ID</label>
          <input
            type="text"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="your-app-id"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Public Key</label>
          <input
            type="text"
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="your-public-key"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">User ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="user-123"
          />
        </div>
      </div>

      <div className="flex gap-4">
        {!isRegistered ? (
          <button
            onClick={registerDevice}
            disabled={!appId || !publicKey || !userId}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Register Device
          </button>
        ) : (
          <button
            onClick={unregisterDevice}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Unregister Device
          </button>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <p className="text-sm">
          <strong>Status:</strong> {isRegistered ? '✅ Registered' : '❌ Not Registered'}
        </p>
        <p className="text-sm">
          <strong>Permission:</strong> {permissionStatus}
        </p>
      </div>
    </div>
  );
}`}
              </pre>
            </div>

            <div className="card mb-6">
              <h3 className="font-semibold text-lg mb-3">3. Use in Page</h3>
              <p className="text-sm text-gray-600 mb-3">
                In <code className="bg-gray-100 px-1">app/page.tsx</code>:
              </p>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {`import NotificationManager from './components/NotificationManager';
import { Toaster } from 'react-hot-toast';

export default function Home() {
  return (
    <>
      <Toaster position="top-right" />
      <NotificationManager />
    </>
  );
}`}
              </pre>
            </div>

            <div className="card">
              <h3 className="font-semibold text-lg mb-3">4. Important Notes</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                <li>
                  Always use{" "}
                  <code className="bg-gray-100 px-1">"use client"</code>{" "}
                  directive for components using browser APIs
                </li>
                <li>
                  Service worker must be in{" "}
                  <code className="bg-gray-100 px-1">public/</code> directory
                </li>
                <li>
                  Use{" "}
                  <code className="bg-gray-100 px-1">
                    window.location.origin
                  </code>{" "}
                  for baseUrl to work in both dev and production
                </li>
                <li>
                  Store configuration in localStorage to persist across page
                  refreshes
                </li>
                <li>
                  Handle SSR by checking{" "}
                  <code className="bg-gray-100 px-1">
                    typeof window !== 'undefined'
                  </code>
                </li>
              </ul>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
