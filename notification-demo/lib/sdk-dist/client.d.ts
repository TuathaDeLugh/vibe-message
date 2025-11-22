import { InitOptions, RegisterDeviceOptions, MessageCallback, SilentMessageCallback } from './types';
export declare class NotificationClient {
    private baseUrl;
    private appId;
    private publicKey;
    private vapidPublicKey;
    private messageCallback;
    private backgroundMessageCallback;
    private silentMessageCallback;
    constructor(options: InitOptions);
    /**
     * Set up listener for messages from service worker
     */
    private setupMessageListener;
    /**
     * Register callback for foreground messages (when app is visible)
     */
    onMessage(callback: MessageCallback): void;
    /**
     * Register callback for background messages (when app is not visible)
     */
    onBackgroundMessage(callback: MessageCallback): void;
    /**
     * Register callback for silent messages (no UI notification)
     */
    onSilentMessage(callback: SilentMessageCallback): void;
    /**
     * Get VAPID public key from server
     */
    private getVapidPublicKey;
    /**
     * Convert base64 string to Uint8Array for VAPID key
     */
    private urlBase64ToUint8Array;
    /**
     * Register service worker and subscribe to push notifications
     */
    registerDevice(options: RegisterDeviceOptions): Promise<void>;
    /**
     * Unregister device from push notifications
     */
    unregisterDevice(externalUserId: string): Promise<void>;
}
export declare function initNotificationClient(options: InitOptions): NotificationClient;
//# sourceMappingURL=client.d.ts.map