-- Migration: Enable PostgreSQL Extensions
-- Purpose: Enable UUID generation and cryptographic functions
-- Phase: Phase 1 - Foundation
-- Date: 2025-09-30
-- Status: NOT APPLIED - Awaiting user permission

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for additional crypto functions if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Comment for documentation
COMMENT ON EXTENSION "uuid-ossp" IS 'UUID generation functions';
COMMENT ON EXTENSION "pgcrypto" IS 'Cryptographic functions';