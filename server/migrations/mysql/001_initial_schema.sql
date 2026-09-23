-- SQL API Builder - MySQL Application Database Schema
-- Run this in your MySQL database

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS sql_api_builder;
USE sql_api_builder;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'developer', 'viewer') NOT NULL DEFAULT 'developer',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Database connections table
CREATE TABLE IF NOT EXISTS database_connections (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('mysql', 'sqlserver', 'postgresql') NOT NULL DEFAULT 'mysql',
  host VARCHAR(255) NOT NULL,
  port INT NOT NULL DEFAULT 3306,
  database_name VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  encrypted_password TEXT NOT NULL,
  ssl_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  connection_timeout INT NOT NULL DEFAULT 30,
  status ENUM('connected', 'disconnected', 'error') NOT NULL DEFAULT 'disconnected',
  last_tested_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SQL queries table
CREATE TABLE IF NOT EXISTS sql_queries (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  connection_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  sql_text TEXT NOT NULL,
  parameters JSON,
  created_by CHAR(36),
  execution_count INT NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (connection_id) REFERENCES database_connections(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- APIs table
CREATE TABLE IF NOT EXISTS apis (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  query_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  method ENUM('GET', 'POST', 'PUT', 'DELETE') NOT NULL DEFAULT 'GET',
  description TEXT,
  version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
  status ENUM('draft', 'published', 'deprecated', 'disabled') NOT NULL DEFAULT 'draft',
  auth_required BOOLEAN NOT NULL DEFAULT TRUE,
  rate_limit INT NOT NULL DEFAULT 100,
  rate_limit_window VARCHAR(10) NOT NULL DEFAULT '1m',
  cache_duration INT NOT NULL DEFAULT 0,
  max_rows INT NOT NULL DEFAULT 1000,
  timeout INT NOT NULL DEFAULT 30,
  pagination_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  page_size INT NOT NULL DEFAULT 50,
  request_count INT NOT NULL DEFAULT 0,
  error_count INT NOT NULL DEFAULT 0,
  avg_response_time INT NOT NULL DEFAULT 0,
  p95_response_time INT NOT NULL DEFAULT 0,
  p99_response_time INT NOT NULL DEFAULT 0,
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_endpoint_version (endpoint, version),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (query_id) REFERENCES sql_queries(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(20) NOT NULL,
  allowed_apis JSON,
  expires_at TIMESTAMP NULL,
  last_used_at TIMESTAMP NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  request_count INT NOT NULL DEFAULT 0,
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API request logs table
CREATE TABLE IF NOT EXISTS api_request_logs (
  id CHAR(36) PRIMARY KEY,
  api_id CHAR(36) NOT NULL,
  api_key_id CHAR(36),
  method VARCHAR(10) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  status_code INT NOT NULL,
  response_time INT NOT NULL,
  parameters JSON,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (api_id) REFERENCES apis(id) ON DELETE CASCADE,
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id CHAR(36),
  details TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rate limit configs table
CREATE TABLE IF NOT EXISTS rate_limit_configs (
  id CHAR(36) PRIMARY KEY,
  api_id CHAR(36) NOT NULL,
  max_requests INT NOT NULL DEFAULT 100,
  window_seconds INT NOT NULL DEFAULT 60,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (api_id) REFERENCES apis(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_database_connections_project ON database_connections(project_id);
CREATE INDEX idx_sql_queries_project ON sql_queries(project_id);
CREATE INDEX idx_apis_project ON apis(project_id);
CREATE INDEX idx_apis_endpoint ON apis(endpoint);
CREATE INDEX idx_apis_status ON apis(status);
CREATE INDEX idx_api_keys_project ON api_keys(project_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_request_logs_api ON api_request_logs(api_id);
CREATE INDEX idx_api_request_logs_created ON api_request_logs(created_at);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
