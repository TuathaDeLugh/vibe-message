import { query, getClient } from '../config/database';
import {
  Notification,
  NotificationLog,
  NotificationPayload,
  DeviceToken,
  PushSubscription,
} from '../types';
import { webpush } from '../utils/webPush';
import { getDevicesByApp } from './deviceService';

/**
 * Retry configuration for push notifications
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
const getRetryDelay = (attempt: number): number => {
  const delay = RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

/**
 * Determine if error is retryable
 */
const isRetryableError = (error: any): boolean => {
  // Retry on network errors, timeouts, and 5xx server errors
  if (error.statusCode) {
    // Don't retry on client errors (4xx) except 429 (rate limit)
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return error.statusCode === 429;
    }
    // Retry on server errors (5xx)
    if (error.statusCode >= 500) {
      return true;
    }
  }

  // Retry on network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }

  return false;
};

/**
 * Send push notification to a single device with retry logic
 */
const sendToDevice = async (
  subscription: PushSubscription,
  payload: string,
  attempt: number = 0
): Promise<void> => {
  try {
    await webpush.sendNotification(subscription, payload);
  } catch (error: any) {
    // If subscription is gone (410), don't retry
    if (error.statusCode === 410) {
      throw error;
    }

    // If error is retryable and we haven't exceeded max retries
    if (isRetryableError(error) && attempt < RETRY_CONFIG.maxRetries) {
      const delay = getRetryDelay(attempt);
      console.log(`[Push Service] Retry attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries} after ${delay}ms`);
      await sleep(delay);
      return sendToDevice(subscription, payload, attempt + 1);
    }

    // Otherwise, throw the error
    throw error;
  }
};

/**
 * Send push notification to multiple devices
 */
export const sendPushNotification = async (
  appId: number,
  notification: NotificationPayload,
  targetUserIds?: string[]
): Promise<{ notificationId: number; sent: number; failed: number }> => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Create notification record
    const notificationResult = await client.query(
      `INSERT INTO notifications (app_id, payload_json, is_silent)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [appId, JSON.stringify(notification), notification.silent || false]
    );

    const notificationRecord: Notification = notificationResult.rows[0];

    // Get target devices
    const devices = await getDevicesByApp(appId, targetUserIds);

    if (devices.length === 0) {
      await client.query('COMMIT');
      return { notificationId: notificationRecord.id, sent: 0, failed: 0 };
    }

    let sentCount = 0;
    let failedCount = 0;

    // Send push to each device
    const sendPromises = devices.map(async (device: DeviceToken) => {
      try {
        const subscription: PushSubscription = JSON.parse(device.subscription_json);

        // Prepare payload for web push
        const payload = JSON.stringify(notification);

        // Send push notification with retry logic
        await sendToDevice(subscription, payload);

        // Log success
        await client.query(
          `INSERT INTO notification_logs (notification_id, device_token_id, status, sent_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          [notificationRecord.id, device.id, 'SENT']
        );

        sentCount++;
        console.log(`[Push Service] ✓ Sent to device ${device.id} (user: ${device.external_user_id})`);
      } catch (error: any) {
        // Categorize error
        const errorCategory = error.statusCode === 410 ? 'SUBSCRIPTION_EXPIRED' :
          isRetryableError(error) ? 'TRANSIENT_ERROR' :
            'PERMANENT_ERROR';

        const errorMessage = `${errorCategory}: ${error.message || 'Unknown error'}`;

        // Log failure with detailed error
        await client.query(
          `INSERT INTO notification_logs (notification_id, device_token_id, status, error_message, sent_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
          [notificationRecord.id, device.id, 'FAILED', errorMessage]
        );

        failedCount++;
        console.error(`[Push Service] ✗ Failed to send to device ${device.id}: ${errorMessage}`);

        // If subscription is invalid (410 Gone), mark device as inactive
        if (error.statusCode === 410) {
          await client.query(
            'UPDATE device_tokens SET is_active = false WHERE id = $1',
            [device.id]
          );
          console.log(`[Push Service] Marked device ${device.id} as inactive (subscription expired)`);
        }
      }
    });

    await Promise.all(sendPromises);

    await client.query('COMMIT');

    console.log(`[Push Service] Notification ${notificationRecord.id} sent: ${sentCount} succeeded, ${failedCount} failed`);

    return {
      notificationId: notificationRecord.id,
      sent: sentCount,
      failed: failedCount,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Push Service] Transaction failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get notification logs for a specific notification
 */
export const getNotificationLogs = async (
  notificationId: number
): Promise<NotificationLog[]> => {
  const result = await query(
    'SELECT * FROM notification_logs WHERE notification_id = $1 ORDER BY sent_at DESC',
    [notificationId]
  );

  return result.rows;
};

/**
 * Get recent notifications for an app
 */
export const getAppNotifications = async (
  appId: number,
  limit: number = 50
): Promise<Notification[]> => {
  const result = await query(
    'SELECT * FROM notifications WHERE app_id = $1 ORDER BY created_at DESC LIMIT $2',
    [appId, limit]
  );

  return result.rows;
};
