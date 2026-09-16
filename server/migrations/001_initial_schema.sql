-- SQL API Builder - Application Database Schema
-- This schema stores users, API definitions, logs, API keys, etc.

-- Enable UUID generation
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'developer', -- admin, developer, viewer
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS database_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'sqlserver', -- sqlserver, postgresql, mysql
  host VARCHAR(255) NOT NULL,
  port INTEGER NOT NULL DEFAULT 1433,
  database_name VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  encrypted_password TEXT NOT NULL, -- AES-256-GCM encrypted
  ssl_enabled BOOLEAN NOT NULL DEFAULT true,
  connection_timeout INTEGER NOT NULL DEFAULT 30,
  status VARCHAR(50) NOT NULL DEFAULT 'disconnected', -- connected, disconnected, error
  last_tested_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sql_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES database_connections(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sql_text TEXT NOT NULL,
  parameters JSONB DEFAULT '[]', -- [{name, type, required, defaultValue, description}]
  created_by UUID REFERENCES users(id),
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS apis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  query_id UUID NOT NULL REFERENCES sql_queries(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL DEFAULT 'GET', -- GET, POST, PUT, DELETE
  description TEXT,
  version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, published, deprecated, disabled
  auth_required BOOLEAN NOT NULL DEFAULT true,
  rate_limit INTEGER NOT NULL DEFAULT 100, -- requests per minute
  rate_limit_window VARCHAR(10) NOT NULL DEFAULT '1m',
  cache_duration INTEGER NOT NULL DEFAULT 0, -- seconds, 0 = no cache
  max_rows INTEGER NOT NULL DEFAULT 1000,
  timeout INTEGER NOT NULL DEFAULT 30, -- seconds
  pagination_enabled BOOLEAN NOT NULL DEFAULT true,
  page_size INTEGER NOT NULL DEFAULT 50,
  request_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  avg_response_time INTEGER NOT NULL DEFAULT 0, -- milliseconds
  p95_response_time INTEGER NOT NULL DEFAULT 0,
  p99_response_time INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(endpoint, version)
);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL, -- bcrypt hash of the API key
  key_prefix VARCHAR(20) NOT NULL, -- First 10 chars for identification
  allowed_apis UUID[] DEFAULT '{}', -- Array of API IDs, empty = all APIs
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id UUID NOT NULL REFERENCES apis(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  method VARCHAR(10) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time INTEGER NOT NULL, -- milliseconds
  parameters JSONB DEFAULT '{}',
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  details TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rate_limit_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id UUID NOT NULL REFERENCES apis(id) ON DELETE CASCADE,
  max_requests INTEGER NOT NULL DEFAULT 100,
  window_seconds INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_database_connections_project ON database_connections(project_id);
CREATE INDEX IF NOT EXISTS idx_sql_queries_project ON sql_queries(project_id);
CREATE INDEX IF NOT EXISTS idx_apis_project ON apis(project_id);
CREATE INDEX IF NOT EXISTS idx_apis_endpoint ON apis(endpoint);
CREATE INDEX IF NOT EXISTS idx_apis_status ON apis(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_project ON api_keys(project_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_api ON api_request_logs(api_id);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_created ON api_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
