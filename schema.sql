-- ============================================================================
-- SmartERP - Database Schema
-- PostgreSQL / Supabase
-- Day 1 & 2: Requirement Analysis & Database Schema Design
-- ============================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS
-- ============================================================================
CREATE TYPE voucher_type AS ENUM (
  'Sales', 'Purchase', 'Receipt', 'Payment', 'Contra', 'Journal'
);

CREATE TYPE group_type AS ENUM (
  'Asset', 'Liability', 'Income', 'Expense', 'Stock'
);

CREATE TYPE ledger_type AS ENUM (
  'Customer', 'Supplier', 'Bank', 'Cash', 'Expense', 'Income'
);

CREATE TYPE unit_of_measure AS ENUM (
  'PCS', 'KG', 'BOX', 'LTR', 'MTR', 'SET'
);

-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- 2a. users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          VARCHAR(255) NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2b. companies
CREATE TABLE companies (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name               VARCHAR(255) NOT NULL,
  address            TEXT,
  gst_number         VARCHAR(50),
  financial_year_start DATE,
  state              VARCHAR(100),
  contact_info       TEXT,
  max_limit          SMALLINT NOT NULL DEFAULT 5 CHECK (max_limit <= 5),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_user_id ON companies(user_id);

-- 2c. groups (hierarchical via parent_group_id)
CREATE TABLE groups (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  parent_group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  type            group_type NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, name)
);

CREATE INDEX idx_groups_company_id ON groups(company_id);
CREATE INDEX idx_groups_parent_group_id ON groups(parent_group_id);

-- 2d. ledgers
CREATE TABLE ledgers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE RESTRICT,
  name            VARCHAR(255) NOT NULL,
  opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  type            ledger_type NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, name)
);

CREATE INDEX idx_ledgers_company_id ON ledgers(company_id);
CREATE INDEX idx_ledgers_group_id   ON ledgers(group_id);

-- 2e. stock_groups (hierarchical)
CREATE TABLE stock_groups (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  parent_group_id UUID REFERENCES stock_groups(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- 2f. stock_items
CREATE TABLE stock_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stock_group_id    UUID REFERENCES stock_groups(id) ON DELETE SET NULL,
  name              VARCHAR(255) NOT NULL,
  sku               VARCHAR(100),
  purchase_price    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  selling_price     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  current_quantity  DECIMAL(15,3) NOT NULL DEFAULT 0.000,
  gst_percentage    DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  unit_of_measure   unit_of_measure NOT NULL DEFAULT 'PCS',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, sku)
);

CREATE INDEX idx_stock_items_company_id ON stock_items(company_id);
CREATE INDEX idx_stock_items_stock_group_id ON stock_items(stock_group_id);

-- ============================================================================
-- 3. TRANSACTION / VOUCHER TABLES
-- ============================================================================

-- 3a. vouchers
CREATE TABLE vouchers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  voucher_type  voucher_type NOT NULL,
  voucher_number VARCHAR(50) NOT NULL,
  voucher_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  narration     TEXT,
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, voucher_number)
);

CREATE INDEX idx_vouchers_company_id ON vouchers(company_id);
CREATE INDEX idx_vouchers_date ON vouchers(voucher_date);
CREATE INDEX idx_vouchers_type ON vouchers(voucher_type);

-- 3b. ledger_entries (double-entry accounting)
CREATE TABLE ledger_entries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id  UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  ledger_id   UUID NOT NULL REFERENCES ledgers(id) ON DELETE RESTRICT,
  amount      DECIMAL(15,2) NOT NULL,
  side        VARCHAR(4) NOT NULL CHECK (side IN ('Dr', 'Cr')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ledger_entries_voucher_id ON ledger_entries(voucher_id);
CREATE INDEX idx_ledger_entries_ledger_id  ON ledger_entries(ledger_id);

-- 3c. inventory_entries (stock movements tied to vouchers)
CREATE TABLE inventory_entries (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id    UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE RESTRICT,
  quantity      DECIMAL(15,3) NOT NULL,
  rate          DECIMAL(15,2) NOT NULL,
  amount        DECIMAL(15,2) NOT NULL,
  direction     VARCHAR(4) NOT NULL CHECK (direction IN ('In', 'Out')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_entries_voucher_id   ON inventory_entries(voucher_id);
CREATE INDEX idx_inventory_entries_stock_item_id ON inventory_entries(stock_item_id);

-- ============================================================================
-- 4. AUDIT LOG (foundation)
-- ============================================================================
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID REFERENCES companies(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_company_id ON audit_log(company_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- ============================================================================
-- 5. AUTO-UPDATE updated_at TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_groups_updated_at
  BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_ledgers_updated_at
  BEFORE UPDATE ON ledgers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_stock_groups_updated_at
  BEFORE UPDATE ON stock_groups FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_stock_items_updated_at
  BEFORE UPDATE ON stock_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_vouchers_updated_at
  BEFORE UPDATE ON vouchers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
