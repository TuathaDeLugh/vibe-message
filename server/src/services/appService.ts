import { query } from '../config/database';
import {
  App,
  AppWithStats,
  CreateAppRequest,
  UpdateAppRequest,
  UserRole,
} from '../types';
import { generateAppId, generateSecretKey } from '../utils/crypto';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export const getUserApps = async (userId: number, role: UserRole): Promise<App[]> => {
  let queryText = 'SELECT * FROM apps';
  const params: any[] = [];

  // Super admin can see all apps, regular admin only their own
  if (role !== 'SUPER_ADMIN') {
    queryText += ' WHERE user_id = $1';
    params.push(userId);
  }

  queryText += ' ORDER BY created_at DESC';

  const result = await query(queryText, params);
  return result.rows;
};

export const getAppById = async (
  appId: number,
  userId: number,
  role: UserRole
): Promise<AppWithStats> => {
  let queryText = `
    SELECT 
      a.*,
      COUNT(DISTINCT dt.id) as device_count,
      COUNT(DISTINCT n.id) as notification_count
    FROM apps a
    LEFT JOIN device_tokens dt ON a.id = dt.app_id AND dt.is_active = true
    LEFT JOIN notifications n ON a.id = n.app_id
    WHERE a.id = $1
  `;
  const params: any[] = [appId];

  // Regular admin can only access their own apps
  if (role !== 'SUPER_ADMIN') {
    queryText += ' AND a.user_id = $2';
    params.push(userId);
  }

  queryText += ' GROUP BY a.id';

  const result = await query(queryText, params);

  if (result.rows.length === 0) {
    throw new NotFoundError('App not found');
  }

  const app = result.rows[0];
  return {
    ...app,
    device_count: parseInt(app.device_count, 10),
    notification_count: parseInt(app.notification_count, 10),
  };
};

export const createApp = async (
  userId: number,
  data: CreateAppRequest
): Promise<App> => {
  // Check user's app limit
  const userResult = await query(
    'SELECT app_limit, status FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const user = userResult.rows[0];

  if (user.status !== 'APPROVED' && user.status !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Your account must be approved to create apps');
  }

  // Check app limit (null means unlimited)
  if (user.app_limit !== null) {
    const appCountResult = await query(
      'SELECT COUNT(*) as count FROM apps WHERE user_id = $1',
      [userId]
    );

    const currentCount = parseInt(appCountResult.rows[0].count, 10);

    if (currentCount >= user.app_limit) {
      throw new ForbiddenError(
        `You have reached your app limit of ${user.app_limit}`
      );
    }
  }

  // Generate unique IDs and keys
  const publicAppId = generateAppId();
  const publicKey = generateSecretKey(); // Public key for SDK authentication
  const secretKey = generateSecretKey(); // Secret key for server-to-server API

  const result = await query(
    `INSERT INTO apps (user_id, name, description, public_app_id, public_key, secret_key)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, data.name, data.description || null, publicAppId, publicKey, secretKey]
  );

  return result.rows[0];
};

export const updateApp = async (
  appId: number,
  userId: number,
  role: UserRole,
  data: UpdateAppRequest
): Promise<App> => {
  const setClauses: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    setClauses.push(`name = $${paramIndex++}`);
    params.push(data.name);
  }

  if (data.description !== undefined) {
    setClauses.push(`description = $${paramIndex++}`);
    params.push(data.description);
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

  let queryText = `UPDATE apps SET ${setClauses.join(', ')} WHERE id = $${paramIndex++}`;
  params.push(appId);

  // Regular admin can only update their own apps
  if (role !== 'SUPER_ADMIN') {
    queryText += ` AND user_id = $${paramIndex++}`;
    params.push(userId);
  }

  queryText += ' RETURNING *';

  const result = await query(queryText, params);

  if (result.rows.length === 0) {
    throw new NotFoundError('App not found');
  }

  return result.rows[0];
};

export const rotateAppSecret = async (
  appId: number,
  userId: number,
  role: UserRole
): Promise<App> => {
  const newSecretKey = generateSecretKey();

  let queryText = `
    UPDATE apps 
    SET secret_key = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `;
  const params: any[] = [newSecretKey, appId];

  // Regular admin can only rotate their own apps
  if (role !== 'SUPER_ADMIN') {
    queryText += ' AND user_id = $3';
    params.push(userId);
  }

  queryText += ' RETURNING *';

  const result = await query(queryText, params);

  if (result.rows.length === 0) {
    throw new NotFoundError('App not found');
  }

  return result.rows[0];
};

export const deleteApp = async (
  appId: number,
  userId: number,
  role: UserRole
): Promise<void> => {
  let queryText = 'DELETE FROM apps WHERE id = $1';
  const params: any[] = [appId];

  // Regular admin can only delete their own apps
  if (role !== 'SUPER_ADMIN') {
    queryText += ' AND user_id = $2';
    params.push(userId);
  }

  const result = await query(queryText, params);

  if (result.rowCount === 0) {
    throw new NotFoundError('App not found');
  }
};

export const getAppByPublicId = async (publicAppId: string): Promise<App | null> => {
  const result = await query(
    'SELECT * FROM apps WHERE public_app_id = $1 AND is_active = true',
    [publicAppId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Validate app credentials for server-to-server API (push notifications)
 * Requires both publicAppId and secretKey
 */
export const validateAppCredentials = async (
  publicAppId: string,
  secretKey: string
): Promise<App> => {
  const result = await query(
    'SELECT * FROM apps WHERE public_app_id = $1 AND secret_key = $2 AND is_active = true',
    [publicAppId, secretKey]
  );

  if (result.rows.length === 0) {
    throw new ForbiddenError('Invalid app credentials');
  }

  return result.rows[0];
};

/**
 * Validate SDK credentials for client SDK (device registration)
 * Requires both publicAppId and publicKey
 */
export const validateSdkCredentials = async (
  publicAppId: string,
  publicKey: string
): Promise<App> => {
  const result = await query(
    'SELECT * FROM apps WHERE public_app_id = $1 AND public_key = $2 AND is_active = true',
    [publicAppId, publicKey]
  );

  if (result.rows.length === 0) {
    throw new ForbiddenError('Invalid SDK credentials');
  }

  return result.rows[0];
};
