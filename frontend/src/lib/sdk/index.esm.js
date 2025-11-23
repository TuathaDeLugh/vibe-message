/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

class NotificationClient {
    constructor(options) {
        this.vapidPublicKey = null;
        // Callback handlers
        this.messageCallback = null;
        this.backgroundMessageCallback = null;
        this.silentMessageCallback = null;
        this.baseUrl = options.baseUrl;
        this.appId = options.appId;
        this.publicKey = options.publicKey;
        // Set up service worker message listener
        this.setupMessageListener();
    }
    /**
     * Set up listener for messages from service worker
     */
    setupMessageListener() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                const message = event.data;
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
    onMessage(callback) {
        this.messageCallback = callback;
    }
    /**
     * Register callback for background messages (when app is not visible)
     */
    onBackgroundMessage(callback) {
        this.backgroundMessageCallback = callback;
    }
    /**
     * Register callback for silent messages (no UI notification)
     */
    onSilentMessage(callback) {
        this.silentMessageCallback = callback;
    }
    /**
     * Get VAPID public key from server
     */
    getVapidPublicKey() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (this.vapidPublicKey) {
                return this.vapidPublicKey;
            }
            const response = yield fetch(`${this.baseUrl}/sdk/vapid-public-key`);
            const data = yield response.json();
            if (!data.success || !((_a = data.data) === null || _a === void 0 ? void 0 : _a.publicKey)) {
                throw new Error('Failed to get VAPID public key');
            }
            this.vapidPublicKey = data.data.publicKey;
            return this.vapidPublicKey;
        });
    }
    /**
     * Convert base64 string to Uint8Array for VAPID key
     */
    urlBase64ToUint8Array(base64String) {
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
    registerDevice(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!('serviceWorker' in navigator)) {
                throw new Error('Service workers are not supported in this browser');
            }
            if (!('PushManager' in window)) {
                throw new Error('Push notifications are not supported in this browser');
            }
            // Request notification permission
            const permission = yield Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error('Notification permission denied');
            }
            // Register service worker
            const swPath = options.serviceWorkerPath || '/push-sw.js';
            const registration = yield navigator.serviceWorker.register(swPath);
            // Wait for service worker to be ready
            yield navigator.serviceWorker.ready;
            // Get VAPID public key
            const vapidPublicKey = yield this.getVapidPublicKey();
            // Subscribe to push notifications
            const subscription = yield registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
            });
            // Convert subscription to plain object
            const subscriptionObject = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
                    auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))),
                },
            };
            // Register device with backend
            const response = yield fetch(`${this.baseUrl}/sdk/register-device`, {
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
            const data = yield response.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to register device');
            }
        });
    }
    /**
     * Unregister device from push notifications
     */
    unregisterDevice(externalUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.baseUrl}/sdk/unregister-device`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    appId: this.appId,
                    externalUserId,
                }),
            });
            const data = yield response.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to unregister device');
            }
            // Unsubscribe from push manager
            if ('serviceWorker' in navigator) {
                const registration = yield navigator.serviceWorker.ready;
                const subscription = yield registration.pushManager.getSubscription();
                if (subscription) {
                    yield subscription.unsubscribe();
                }
            }
        });
    }
}
function initNotificationClient(options) {
    return new NotificationClient(options);
}

export { NotificationClient, initNotificationClient };
//# sourceMappingURL=index.esm.js.map
