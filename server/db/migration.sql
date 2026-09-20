-- Migration script for SQL API Builder Production Tables
-- Run this on your production database (MySQL or SQL Server)

-- For MySQL, use this version:
-- CREATE TABLE IF NOT EXISTS users (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     email VARCHAR(255) NOT NULL UNIQUE,
--     password_hash VARCHAR(255) NOT NULL,
--     name VARCHAR(255),
--     role VARCHAR(50) DEFAULT 'user',
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- );

-- CREATE TABLE IF NOT EXISTS connections (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     user_id INT NOT NULL,
--     name VARCHAR(255) NOT NULL,
--     type VARCHAR(50) NOT NULL,
--     host VARCHAR(255),
--     port INT,
--     database_name VARCHAR(255),
--     username VARCHAR(255),
--     password_encrypted TEXT,
--     is_default BOOLEAN DEFAULT FALSE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- );

-- CREATE TABLE IF NOT EXISTS apis (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     user_id INT NOT NULL,
--     connection_id INT NOT NULL,
--     name VARCHAR(255) NOT NULL,
--     description TEXT,
--     query TEXT NOT NULL,
--     method VARCHAR(10) DEFAULT 'GET',
--     endpoint VARCHAR(255) NOT NULL,
--     parameters JSON,
--     is_published BOOLEAN DEFAULT FALSE,
--     requires_auth BOOLEAN DEFAULT TRUE,
--     rate_limit INT DEFAULT 100,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
--     FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
-- );

-- CREATE TABLE IF NOT EXISTS api_keys (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     user_id INT NOT NULL,
--     key_value VARCHAR(255) NOT NULL UNIQUE,
--     name VARCHAR(255) NOT NULL,
--     permissions JSON,
--     expires_at TIMESTAMP NULL,
--     is_active BOOLEAN DEFAULT TRUE,
--     last_used_at TIMESTAMP NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- );

-- CREATE TABLE IF NOT EXISTS api_logs (
--     id BIGINT AUTO_INCREMENT PRIMARY KEY,
--     api_id INT,
--     api_key_id INT,
--     user_id INT,
--     method VARCHAR(10),
--     endpoint VARCHAR(255),
--     status_code INT,
--     response_time_ms INT,
--     ip_address VARCHAR(50),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (api_id) REFERENCES apis(id) ON DELETE SET NULL,
--     FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL,
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
-- );

-- For SQL Server, use this version:
IF OBJECT_ID('dbo.users', 'U') IS NULL
CREATE TABLE [dbo].[users] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [email] NVARCHAR(255) NOT NULL UNIQUE,
    [password_hash] NVARCHAR(255) NOT NULL,
    [name] NVARCHAR(255),
    [role] NVARCHAR(50) DEFAULT 'user',
    [created_at] DATETIME2 DEFAULT GETDATE(),
    [updated_at] DATETIME2 DEFAULT GETDATE()
);

IF OBJECT_ID('dbo.connections', 'U') IS NULL
CREATE TABLE [dbo].[connections] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [user_id] INT NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [type] NVARCHAR(50) NOT NULL,
    [host] NVARCHAR(255),
    [port] INT,
    [database_name] NVARCHAR(255),
    [username] NVARCHAR(255),
    [password_encrypted] NVARCHAR(MAX),
    [is_default] BIT DEFAULT 0,
    [created_at] DATETIME2 DEFAULT GETDATE(),
    [updated_at] DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT [FK_connections_users] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE
);

IF OBJECT_ID('dbo.apis', 'U') IS NULL
CREATE TABLE [dbo].[apis] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [user_id] INT NOT NULL,
    [connection_id] INT NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(MAX),
    [query] NVARCHAR(MAX) NOT NULL,
    [method] NVARCHAR(10) DEFAULT 'GET',
    [endpoint] NVARCHAR(255) NOT NULL,
    [parameters] NVARCHAR(MAX),
    [is_published] BIT DEFAULT 0,
    [requires_auth] BIT DEFAULT 1,
    [rate_limit] INT DEFAULT 100,
    [created_at] DATETIME2 DEFAULT GETDATE(),
    [updated_at] DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT [FK_apis_users] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_apis_connections] FOREIGN KEY ([connection_id]) REFERENCES [dbo].[connections]([id]) ON DELETE CASCADE
);

IF OBJECT_ID('dbo.api_keys', 'U') IS NULL
CREATE TABLE [dbo].[api_keys] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [user_id] INT NOT NULL,
    [key_value] NVARCHAR(255) NOT NULL UNIQUE,
    [name] NVARCHAR(255) NOT NULL,
    [permissions] NVARCHAR(MAX),
    [expires_at] DATETIME2,
    [is_active] BIT DEFAULT 1,
    [last_used_at] DATETIME2,
    [created_at] DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT [FK_api_keys_users] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE
);

IF OBJECT_ID('dbo.api_logs', 'U') IS NULL
CREATE TABLE [dbo].[api_logs] (
    [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [api_id] INT,
    [api_key_id] INT,
    [user_id] INT,
    [method] NVARCHAR(10),
    [endpoint] NVARCHAR(255),
    [status_code] INT,
    [response_time_ms] INT,
    [ip_address] NVARCHAR(50),
    [created_at] DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT [FK_api_logs_apis] FOREIGN KEY ([api_id]) REFERENCES [dbo].[apis]([id]) ON DELETE SET NULL,
    CONSTRAINT [FK_api_logs_api_keys] FOREIGN KEY ([api_key_id]) REFERENCES [dbo].[api_keys]([id]) ON DELETE SET NULL,
    CONSTRAINT [FK_api_logs_users] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE SET NULL
);

-- Create indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_connections_user')
CREATE INDEX [idx_connections_user] ON [dbo].[connections]([user_id]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_apis_user')
CREATE INDEX [idx_apis_user] ON [dbo].[apis]([user_id]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_apis_connection')
CREATE INDEX [idx_apis_connection] ON [dbo].[apis]([connection_id]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_api_keys_user')
CREATE INDEX [idx_api_keys_user] ON [dbo].[api_keys]([user_id]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_api_keys_value')
CREATE INDEX [idx_api_keys_value] ON [dbo].[api_keys]([key_value]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_api_logs_api')
CREATE INDEX [idx_api_logs_api] ON [dbo].[api_logs]([api_id]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_api_logs_created')
CREATE INDEX [idx_api_logs_created] ON [dbo].[api_logs]([created_at]);
