-- FCM Clone Platform Database Schema

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS device_tokens CASCADE;
DROP TABLE IF EXISTS warnings CASCADE;
DROP TABLE IF EXISTS apps CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (platform admins)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN')),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'BANNED')),
  app_limit INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Apps table (projects created by users)
CREATE TABLE apps (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  public_app_id VARCHAR(50) UNIQUE NOT NULL,
  public_key VARCHAR(100) NOT NULL,  -- For client SDK authentication
  secret_key VARCHAR(100) NOT NULL,  -- For server-to-server API authentication
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device tokens (end-user devices in external apps)
CREATE TABLE device_tokens (
  id SERIAL PRIMARY KEY,
  app_id INTEGER REFERENCES apps(id) ON DELETE CASCADE,
  external_user_id VARCHAR(255) NOT NULL,
  subscription_json TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  app_id INTEGER REFERENCES apps(id) ON DELETE CASCADE,
  payload_json TEXT NOT NULL,
  is_silent BOOLEAN DEFAULT false,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification logs (per-device delivery status)
CREATE TABLE notification_logs (
  id SERIAL PRIMARY KEY,
  notification_id INTEGER REFERENCES notifications(id) ON DELETE CASCADE,
  device_token_id INTEGER REFERENCES device_tokens(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
  error_message TEXT,
  sent_at TIMESTAMP
);

-- Warnings (super admin warnings to users)
CREATE TABLE warnings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_apps_user_id ON apps(user_id);
CREATE INDEX idx_apps_public_app_id ON apps(public_app_id);
CREATE INDEX idx_device_tokens_app_id ON device_tokens(app_id);
CREATE INDEX idx_device_tokens_external_user ON device_tokens(app_id, external_user_id);
CREATE INDEX idx_notifications_app_id ON notifications(app_id);
CREATE INDEX idx_notification_logs_notification_id ON notification_logs(notification_id);
CREATE INDEX idx_notification_logs_device_token_id ON notification_logs(device_token_id);
CREATE INDEX idx_warnings_user_id ON warnings(user_id);

-- Add unique constraint for device tokens to prevent duplicates
CREATE UNIQUE INDEX idx_device_tokens_unique ON device_tokens(app_id, external_user_id, (md5(subscription_json)));
