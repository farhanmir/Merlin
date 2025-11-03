-- Merlin Database Migration Script
-- Created: 2025-01-03
-- Purpose: Add user authentication and per-user chat storage

-- ============================================
-- Step 1: Create Users table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- Step 2: Create Chat Messages table
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    model VARCHAR(100),
    techniques TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);

-- ============================================
-- Step 3: Add user_id to existing api_keys table
-- ============================================
-- Note: This will fail if user_id column already exists (safe to ignore)
ALTER TABLE api_keys 
ADD COLUMN IF NOT EXISTS user_id VARCHAR(255) NOT NULL DEFAULT 'migration';

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- Remove default after migration (optional, uncomment if needed)
-- ALTER TABLE api_keys ALTER COLUMN user_id DROP DEFAULT;

-- ============================================
-- Step 4: Drop old unique constraint on provider
-- ============================================
-- Note: This allows multiple users to use the same provider
ALTER TABLE api_keys 
DROP CONSTRAINT IF EXISTS api_keys_provider_key;

-- ============================================
-- Step 5: Add composite unique constraint
-- ============================================
-- Note: Ensures one key per provider per user
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'api_keys_user_provider_unique'
    ) THEN
        ALTER TABLE api_keys 
        ADD CONSTRAINT api_keys_user_provider_unique 
        UNIQUE (user_id, provider);
    END IF;
END $$;

-- ============================================
-- Verification Queries (Run after migration)
-- ============================================
-- Check users table
-- SELECT COUNT(*) as user_count FROM users;

-- Check chat_messages table
-- SELECT COUNT(*) as message_count FROM chat_messages;

-- Check api_keys schema
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'api_keys';

-- Check constraints
-- SELECT conname, contype FROM pg_constraint WHERE conrelid = 'api_keys'::regclass;
