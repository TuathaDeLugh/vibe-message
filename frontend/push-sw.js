// Service Worker for Vibe Message Push Notifications

self.addEventListener("push", (event) => {
  console.log("Push notification received:", event);

  const data = event.data ? event.data.json() : {};

  // Handle silent notifications
  if (data.silent) {
    console.log("Silent push notification received:", data);
    // You can handle silent notifications here
    // For example, update IndexedDB, send message to clients, etc.
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "SILENT_PUSH",
            data: data.data || {},
          });
        });
      })
    );
    return;
  }

  // Display notification
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

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const focusedClient = clients.find((client) => client.focused);

      if (focusedClient) {
        focusedClient.postMessage({
          type: "FOREGROUND_PUSH",
          payload: {
            title,
            body: options.body,
            icon: options.icon,
            data: options.data,
          },
        });
      } else {
        return self.registration.showNotification(title, options);
      }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  event.notification.close();

  const urlToOpen = event.notification.data?.click_action || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open with this URL
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event);
});
