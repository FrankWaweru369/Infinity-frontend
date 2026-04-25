self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};

  self.registration.showNotification(data.title || "Infinity", {
    body: data.body || "You have a new notification",
    icon: "/icons/icon-192x192.png",
    data: data.url || "/",
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data || "/")
  );
});;
