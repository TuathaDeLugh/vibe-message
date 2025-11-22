export type UserRole = 'SUPER_ADMIN' | 'ADMIN';
export type UserStatus = 'PENDING' | 'APPROVED' | 'BANNED';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  app_limit: number | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface App {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  public_app_id: string;
  public_key: string;
  secret_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppWithStats extends App {
  device_count: number;
  notification_count: number;
}

export interface Warning {
  id: number;
  user_id: number;
  message: string;
  created_by: number;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
