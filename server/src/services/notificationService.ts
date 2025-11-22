import { query } from '../config/database';
import { sendPushNotification } from './pushService';

/**
 * Send notification to a specific user by email
 */
export const notifyUserEvent = async (
    appId: number,
    userEmail: string,
    notification: {
        title: string;
        body: string;
        icon?: string;
    }
) => {
    try {
        await sendPushNotification(appId, notification, {
            externalUserIds: [userEmail]
        });
        console.log(`✅ Notification sent to ${userEmail}: ${notification.title}`);
    } catch (error) {
        console.error(`❌ Failed to send notification to ${userEmail}:`, error);
    }
};

/**
 * Send notification to all super admins
 */
export const notifySuperAdmins = async (
    appId: number,
    notification: {
        title: string;
        body: string;
        icon?: string;
    }
) => {
    try {
        // Get all super admin emails
        const result = await query(
            `SELECT email FROM users WHERE role = 'SUPER_ADMIN' AND status = 'APPROVED'`
        );

        const superAdminEmails = result.rows.map((row: any) => row.email);

        if (superAdminEmails.length === 0) {
            console.log('⚠️ No super admins found to notify');
            return;
        }

        // Send notification to all super admins
        for (const email of superAdminEmails) {
            await notifyUserEvent(appId, email, notification);
        }

        console.log(`✅ Notified ${superAdminEmails.length} super admin(s)`);
    } catch (error) {
        console.error('❌ Failed to notify super admins:', error);
    }
};

/**
 * Get the admin app ID (first app in the system)
 * This app is used for sending admin panel notifications
 */
export const getAdminAppId = async (): Promise<number | null> => {
    try {
        const result = await query('SELECT id FROM apps ORDER BY id LIMIT 1');
        return result.rows[0]?.id || null;
    } catch (error) {
        console.error('❌ Failed to get admin app ID:', error);
        return null;
    }
};
