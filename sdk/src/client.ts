import {
  InitOptions,
  RegisterDeviceOptions,
  PushSubscription,
  MessageCallback,
  SilentMessageCallback,
  ServiceWorkerMessage,
  NotificationPayload,
} from './types';

export class NotificationClient {
  private baseUrl: string;
  private appId: string;
  private publicKey: string;
  private vapidPublicKey: string | null = null;

  // Callback handlers
  private messageCallback: MessageCallback | null = null;
  private backgroundMessageCallback: MessageCallback | null = null;
  private silentMessageCallback: SilentMessageCallback | null = null;

  constructor(options: InitOptions) {
    this.baseUrl = options.baseUrl;
    this.appId = options.appId;
    this.publicKey = options.publicKey;

    // Set up service worker message listener
    this.setupMessageListener();
  }

  /**
   * Set up listener for messages from service worker
   */
  private setupMessageListener(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const message: ServiceWorkerMessage = event.data;

        switch (message.type) {
          case 'FOREGROUND_MESSAGE':
            if (this.messageCallback) {
              this.messageCallback(message.payload);
            }
            break;
          case 'BACKGROUND_MESSAGE':
            if (this.backgroundMessageCallback) {
              this.backgroundMessageCallback(message.payload);
            }
            break;
          case 'SILENT_MESSAGE':
            if (this.silentMessageCallback) {
              this.silentMessageCallback(message.data);
            }
            break;
        }
      });
    }
  }

  /**
   * Register callback for foreground messages (when app is visible)
   */
  onMessage(callback: MessageCallback): void {
    this.messageCallback = callback;
  }

  /**
   * Register callback for background messages (when app is not visible)
   */
  onBackgroundMessage(callback: MessageCallback): void {
    this.backgroundMessageCallback = callback;
  }

  /**
   * Register callback for silent messages (no UI notification)
   */
  onSilentMessage(callback: SilentMessageCallback): void {
    this.silentMessageCallback = callback;
  }

  /**
   * Get VAPID public key from server
   */
  private async getVapidPublicKey(): Promise<string> {
    if (this.vapidPublicKey) {
      return this.vapidPublicKey;
    }

    const response = await fetch(`${this.baseUrl}/sdk/vapid-public-key`);
    const data = await response.json();

    if (!data.success || !data.data?.publicKey) {
      throw new Error('Failed to get VAPID public key');
    }

    this.vapidPublicKey = data.data.publicKey;
    return this.vapidPublicKey!;
  }

  /**
   * Convert base64 string to Uint8Array for VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Register service worker and subscribe to push notifications
   */
  async registerDevice(options: RegisterDeviceOptions): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported in this browser');
    }

    if (!('PushManager' in window)) {
      throw new Error('Push notifications are not supported in this browser');
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    // Register service worker
    const swPath = options.serviceWorkerPath || '/push-sw.js';
    const registration = await navigator.serviceWorker.register(swPath);

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Get VAPID public key
    const vapidPublicKey = await this.getVapidPublicKey();

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
    });

    // Convert subscription to plain object
    const subscriptionObject: PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
      },
    };

    // Register device with backend
    const response = await fetch(`${this.baseUrl}/sdk/register-device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appId: this.appId,
        publicKey: this.publicKey,
        externalUserId: options.externalUserId,
        subscription: subscriptionObject,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to register device');
    }
  }

  /**
   * Unregister device from push notifications
   */
  async unregisterDevice(externalUserId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sdk/unregister-device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appId: this.appId,
        externalUserId,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to unregister device');
    }

    // Unsubscribe from push manager
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
    }
  }
}

export function initNotificationClient(options: InitOptions): NotificationClient {
  return new NotificationClient(options);
}
