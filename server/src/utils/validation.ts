import {
  SignupRequest,
  LoginRequest,
  CreateAppRequest,
  UpdateAppRequest,
  RegisterDeviceRequest,
  UnregisterDeviceRequest,
  SendPushRequest,
  UpdateUserStatusRequest,
  UpdateAppLimitRequest,
  CreateWarningRequest,
} from '../types';
import { ValidationError } from './errors';

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  return password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password);
};

export const validateSignup = (data: any): SignupRequest => {
  let { name, email, password } = data;

  if (name && typeof name === 'string') {
    name = name.trim();
  }

  if (email && typeof email === 'string') {
    email = email.trim();
  }

  if (!name || name.length === 0) {
    throw new ValidationError('Name is required');
  }

  if (!email || !isValidEmail(email)) {
    throw new ValidationError('Valid email is required');
  }

  if (!password || !isStrongPassword(password)) {
    throw new ValidationError(
      'Password must be at least 8 characters with uppercase, lowercase, and number'
    );
  }

  return { name, email: email.toLowerCase(), password };
};

export const validateLogin = (data: any): LoginRequest => {
  let { email, password } = data;

  if (email && typeof email === 'string') {
    email = email.trim();
  }

  if (!email || !isValidEmail(email)) {
    throw new ValidationError('Valid email is required');
  }

  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password is required');
  }

  return { email: email.toLowerCase(), password };
};

export const validateCreateApp = (data: any): CreateAppRequest => {
  const { name, description } = data;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new ValidationError('App name is required');
  }

  return {
    name: name.trim(),
    description: description ? String(description).trim() : undefined,
  };
};

export const validateUpdateApp = (data: any): UpdateAppRequest => {
  const { name, description } = data;
  const updates: UpdateAppRequest = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('App name must be a non-empty string');
    }
    updates.name = name.trim();
  }

  if (description !== undefined) {
    updates.description = description ? String(description).trim() : undefined;
  }

  if (Object.keys(updates).length === 0) {
    throw new ValidationError('At least one field must be provided for update');
  }

  return updates;
};

export const validateRegisterDevice = (data: any): RegisterDeviceRequest => {
  const { appId, publicKey, externalUserId, subscription } = data;

  if (!appId || typeof appId !== 'string') {
    throw new ValidationError('appId is required');
  }

  if (!publicKey || typeof publicKey !== 'string') {
    throw new ValidationError('publicKey is required');
  }

  if (!externalUserId || typeof externalUserId !== 'string') {
    throw new ValidationError('externalUserId is required');
  }

  if (!subscription || typeof subscription !== 'object') {
    throw new ValidationError('subscription is required');
  }

  if (!subscription.endpoint || typeof subscription.endpoint !== 'string') {
    throw new ValidationError('subscription.endpoint is required');
  }

  if (!subscription.keys || typeof subscription.keys !== 'object') {
    throw new ValidationError('subscription.keys is required');
  }

  if (!subscription.keys.p256dh || !subscription.keys.auth) {
    throw new ValidationError('subscription.keys.p256dh and auth are required');
  }

  return { appId, publicKey, externalUserId, subscription };
};

export const validateUnregisterDevice = (data: any): UnregisterDeviceRequest => {
  const { appId, externalUserId } = data;

  if (!appId || typeof appId !== 'string') {
    throw new ValidationError('appId is required');
  }

  if (!externalUserId || typeof externalUserId !== 'string') {
    throw new ValidationError('externalUserId is required');
  }

  return { appId, externalUserId };
};

export const validateSendPush = (data: any): SendPushRequest => {
  const { appId, secretKey, targets, notification } = data;

  if (!appId || typeof appId !== 'string') {
    throw new ValidationError('appId is required');
  }

  if (!secretKey || typeof secretKey !== 'string') {
    throw new ValidationError('secretKey is required');
  }

  if (!notification || typeof notification !== 'object') {
    throw new ValidationError('notification is required');
  }

  if (!notification.title || typeof notification.title !== 'string') {
    throw new ValidationError('notification.title is required');
  }

  return { appId, secretKey, targets, notification };
};

export const validateUpdateUserStatus = (data: any): UpdateUserStatusRequest => {
  const { status } = data;

  if (!status || !['PENDING', 'APPROVED', 'BANNED'].includes(status)) {
    throw new ValidationError('status must be PENDING, APPROVED, or BANNED');
  }

  return { status };
};

export const validateUpdateAppLimit = (data: any): UpdateAppLimitRequest => {
  const { appLimit } = data;

  if (appLimit !== null && (typeof appLimit !== 'number' || appLimit < 0)) {
    throw new ValidationError('appLimit must be a positive number or null');
  }

  return { appLimit };
};

export const validateCreateWarning = (data: any): CreateWarningRequest => {
  const { message } = data;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new ValidationError('Warning message is required');
  }

  return { message: message.trim() };
};

export const validateUpdateProfile = (data: any): { name?: string; email?: string } => {
  let { name, email } = data;
  const updates: { name?: string; email?: string } = {};

  if (name !== undefined) {
    if (typeof name === 'string') {
      name = name.trim();
    }
    if (typeof name !== 'string' || name.length === 0) {
      throw new ValidationError('Name must be a non-empty string');
    }
    updates.name = name;
  }

  if (email !== undefined) {
    if (typeof email === 'string') {
      email = email.trim();
    }
    if (!isValidEmail(email)) {
      throw new ValidationError('Valid email is required');
    }
    updates.email = email.toLowerCase();
  }

  if (Object.keys(updates).length === 0) {
    throw new ValidationError('At least one field (name or email) must be provided');
  }

  return updates;
};

export const validateChangePassword = (data: any): void => {
  if (!data.oldPassword || typeof data.oldPassword !== 'string') {
    throw new ValidationError('Current password is required');
  }

  if (!data.newPassword || typeof data.newPassword !== 'string') {
    throw new ValidationError('New password is required');
  }

  if (data.newPassword.length < 6) {
    throw new ValidationError('New password must be at least 6 characters');
  }

  if (data.oldPassword === data.newPassword) {
    throw new ValidationError('New password must be different from current password');
  }
};
