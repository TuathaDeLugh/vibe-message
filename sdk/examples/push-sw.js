// Service Worker for Vibe Message Push Notifications
// Implements FCM-like behavior: visibility detection and message routing

self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push notification received:", event);

  const data = event.data ? event.data.json() : {};

  // Handle silent notifications (no UI, just data sync)
  if (data.silent) {
    console.log("[Service Worker] Silent push notification received:", data);
    event.waitUntil(
      self.clients
        .matchAll({ includeUncontrolled: true, type: "window" })
        .then((clients) => {
          // Send silent message to all clients
          clients.forEach((client) => {
            client.postMessage({
              type: "SILENT_MESSAGE",
              data: data.data || {},
            });
          });
        })
    );
    return;
  }

  // Check if any client window is focused (app is visible)
  event.waitUntil(
    self.clients
      .matchAll({ includeUncontrolled: true, type: "window" })
      .then((clients) => {
        const focusedClient = clients.find((client) => client.focused);

        if (focusedClient) {
          // App is visible - send message to foreground
          console.log(
            "[Service Worker] App is visible, sending foreground message"
          );
          focusedClient.postMessage({
            type: "FOREGROUND_MESSAGE",
            payload: data,
          });
        } else {
          // App is not visible - show push notification
          console.log(
            "[Service Worker] App is not visible, showing push notification"
          );
          const title = data.title || "Notification";
          const options = {
            body: data.body || "",
            icon: data.icon || "/icon.png",
            image: data.image,
            badge: "/badge.png",
            data: {
              click_action: data.click_action || "/",
              ...data.data,
            },
            requireInteraction: false,
            tag: "fcm-clone-notification",
          };

          return self.registration.showNotification(title, options);
        }
      })
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked:", event);

  event.notification.close();

  const urlToOpen = event.notification.data?.click_action || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open with this URL
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            // Send background message callback
            client.postMessage({
              type: "BACKGROUND_MESSAGE",
              payload: event.notification.data,
            });
            return client.focus();
          }
        }

        // If not, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen).then((client) => {
            if (client) {
              // Send background message to new window
              client.postMessage({
                type: "BACKGROUND_MESSAGE",
                payload: event.notification.data,
              });
            }
          });
        }
      })
  );
});

self.addEventListener("notificationclose", (event) => {
  console.log("[Service Worker] Notification closed:", event);
});

// Handle service worker activation
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activated");
  event.waitUntil(self.clients.claim());
});

// Handle service worker installation
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installed");
  self.skipWaiting();
});
