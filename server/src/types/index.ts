// User types
export type UserRole = 'SUPER_ADMIN' | 'ADMIN';
export type UserStatus = 'PENDING' | 'APPROVED' | 'BANNED';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  app_limit: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  app_limit: number | null;
  created_at: Date;
  updated_at: Date;
}

// App types
export interface App {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  public_app_id: string;
  public_key: string;
  secret_key: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AppWithStats extends App {
  device_count: number;
  notification_count: number;
}

// Device token types
export interface DeviceToken {
  id: number;
  app_id: number;
  external_user_id: string;
  subscription_json: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Notification types
export interface Notification {
  id: number;
  app_id: number;
  payload_json: string;
  is_silent: boolean;
  created_by: number | null;
  created_at: Date;
}

export interface NotificationPayload {
  title: string;
  body?: string;
  icon?: string;
  image?: string;
  click_action?: string;
  data?: Record<string, any>;
  silent?: boolean;
}

export type NotificationLogStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface NotificationLog {
  id: number;
  notification_id: number;
  device_token_id: number;
  status: NotificationLogStatus;
  error_message: string | null;
  sent_at: Date | null;
}

// Warning types
export interface Warning {
  id: number;
  user_id: number;
  message: string;
  created_by: number;
  created_at: Date;
}

// Request/Response types
export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface CreateAppRequest {
  name: string;
  description?: string;
}

export interface UpdateAppRequest {
  name?: string;
  description?: string;
}

export interface RegisterDeviceRequest {
  appId: string;
  publicKey: string;
  externalUserId: string;
  subscription: PushSubscription;
}

export interface UnregisterDeviceRequest {
  appId: string;
  externalUserId: string;
}

export interface SendPushRequest {
  appId: string;
  secretKey: string;
  targets?: {
    externalUserIds?: string[];
    all?: boolean;
  };
  notification: NotificationPayload;
}

export interface UpdateUserStatusRequest {
  status: UserStatus;
}

export interface UpdateAppLimitRequest {
  appLimit: number | null;
}

export interface CreateWarningRequest {
  message: string;
}

// JWT Payload
export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
  status: UserStatus;
}

// Express Request with user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
