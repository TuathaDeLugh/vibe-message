// Message types for service worker communication
export interface ForegroundMessage {
  type: 'FOREGROUND_MESSAGE';
  payload: NotificationPayload;
}

export interface BackgroundMessage {
  type: 'BACKGROUND_MESSAGE';
  payload: NotificationPayload;
}

export interface SilentMessage {
  type: 'SILENT_MESSAGE';
  data: Record<string, any>;
}

export type ServiceWorkerMessage = ForegroundMessage | BackgroundMessage | SilentMessage;

// Notification payload from server
export interface NotificationPayload {
  title: string;
  body?: string;
  icon?: string;
  image?: string;
  click_action?: string;
  data?: Record<string, any>;
  silent?: boolean;
}

// Callback types
export type MessageCallback = (payload: NotificationPayload) => void;
export type SilentMessageCallback = (data: Record<string, any>) => void;

export interface InitOptions {
  baseUrl: string;
  appId: string;
  publicKey: string;
}

export interface RegisterDeviceOptions {
  externalUserId: string;
  serviceWorkerPath?: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
