-- Fix Timezone-Aware DateTime Issue
-- This migration converts TIMESTAMP columns to TIMESTAMP WITH TIME ZONE
-- to resolve the "can't subtract offset-naive and offset-aware datetimes" error

-- Run this on existing PostgreSQL databases that have TIMESTAMP WITHOUT TIME ZONE columns

-- Step 1: Fix users table
ALTER TABLE users 
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE users 
ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Step 2: Fix api_keys table
ALTER TABLE api_keys 
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE api_keys 
ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Step 3: Fix chat_messages table
ALTER TABLE chat_messages 
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Step 4: Fix workflows table (if exists)
ALTER TABLE workflows 
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE workflows 
ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE workflows 
ALTER COLUMN started_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE workflows 
ALTER COLUMN completed_at TYPE TIMESTAMP WITH TIME ZONE;

-- Step 5: Fix workflow_steps table (if exists)
ALTER TABLE workflow_steps 
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE workflow_steps 
ALTER COLUMN started_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE workflow_steps 
ALTER COLUMN completed_at TYPE TIMESTAMP WITH TIME ZONE;

-- Verification: Check column types
SELECT 
    table_name, 
    column_name, 
    data_type,
    CASE 
        WHEN data_type = 'timestamp with time zone' THEN '✓ Fixed'
        WHEN data_type = 'timestamp without time zone' THEN '✗ Needs Fix'
        ELSE data_type
    END as status
FROM information_schema.columns
WHERE table_name IN ('users', 'api_keys', 'chat_messages', 'workflows', 'workflow_steps')
  AND column_name IN ('created_at', 'updated_at', 'started_at', 'completed_at')
ORDER BY table_name, column_name;
