-- King GameCenter - Initial Database Schema
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================
-- SETTINGS
-- =====================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

INSERT INTO settings (key, value) VALUES
  ('store_name', 'THE KING STATION'),
  ('currency', 'SYP'),
  ('rounding', '0'),
  ('digital_menu_notifications', 'true'),
  ('logo_url', '')
ON CONFLICT (key) DO NOTHING;

-- =====================
-- SECTIONS
-- =====================
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO sections (name, sort_order) VALUES ('قسم رئيسي', 1) ON CONFLICT DO NOTHING;

-- =====================
-- DEVICE TYPES
-- =====================
CREATE TABLE IF NOT EXISTS device_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO device_types (name) VALUES ('PC'), ('PC-New'), ('PC-online'), ('PS4'), ('PS5')
ON CONFLICT (name) DO NOTHING;

-- =====================
-- PLAY MODES
-- =====================
CREATE TABLE IF NOT EXISTS play_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  players_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO play_modes (name, players_count) VALUES
  ('فردي', 1), ('ثنائي', 2), ('ثلاثي', 3), ('رباعي', 4)
ON CONFLICT (name) DO NOTHING;

-- =====================
-- SHIFTS
-- =====================
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO shifts (name, start_time, end_time) VALUES ('كامل', '06:00', '10:00') ON CONFLICT DO NOTHING;

-- =====================
-- SCREENS
-- =====================
CREATE TABLE IF NOT EXISTS screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  device_type_id UUID REFERENCES device_types(id) ON DELETE SET NULL,
  ip TEXT,
  port INTEGER DEFAULT 9471,
  secret TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','playing','locked','offline')),
  current_session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PRICE MATRIX
-- =====================
CREATE TABLE IF NOT EXISTS price_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
  device_type_id UUID REFERENCES device_types(id) ON DELETE CASCADE,
  play_mode_id UUID REFERENCES play_modes(id) ON DELETE CASCADE,
  price_per_hour NUMERIC(10,2) NOT NULL DEFAULT 0,
  UNIQUE(shift_id, device_type_id, play_mode_id)
);

-- =====================
-- SESSIONS
-- =====================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id UUID REFERENCES screens(id) ON DELETE SET NULL,
  play_mode_id UUID REFERENCES play_modes(id) ON DELETE SET NULL,
  customer_id UUID,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_amount NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','ended','cancelled')),
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- CATEGORIES
-- =====================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  revenue_box_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (name, sort_order) VALUES ('مشروبات', 1) ON CONFLICT DO NOTHING;

-- =====================
-- PRODUCTS
-- =====================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sale_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  purchase_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  alert_qty INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','low','out')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PRODUCT ADDONS
-- =====================
CREATE TABLE IF NOT EXISTS product_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  additional_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- SUPPLIERS
-- =====================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PURCHASE INVOICES
-- =====================
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  inv_number TEXT NOT NULL,
  inv_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  cash_on_delivery BOOLEAN NOT NULL DEFAULT false,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL,
  unit_cost NUMERIC(10,2) NOT NULL
);

-- =====================
-- INVENTORY COUNTS
-- =====================
CREATE TABLE IF NOT EXISTS inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalized_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','finalized')),
  user_id UUID
);

CREATE TABLE IF NOT EXISTS inventory_count_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id UUID REFERENCES inventory_counts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  system_qty INTEGER NOT NULL DEFAULT 0,
  counted_qty INTEGER NOT NULL DEFAULT 0
);

-- =====================
-- POS ORDERS
-- =====================
CREATE TABLE IF NOT EXISTS pos_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_type TEXT NOT NULL DEFAULT 'cash' CHECK (payment_type IN ('cash','session','customer_debt')),
  table_name TEXT,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  customer_id UUID,
  user_id UUID,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','refunded'))
);

CREATE TABLE IF NOT EXISTS pos_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES pos_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  addons_json JSONB NOT NULL DEFAULT '[]'
);

-- =====================
-- CUSTOMERS
-- =====================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  username TEXT,
  password_hash TEXT,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('debt_added','payment','opening_balance','refund')),
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  ref_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled BOOLEAN NOT NULL DEFAULT false,
  user_id UUID
);

-- =====================
-- CASH BOXES
-- =====================
CREATE TABLE IF NOT EXISTS cash_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'cash' CHECK (type IN ('cash','safe')),
  balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO cash_boxes (name, type, balance) VALUES ('صندوق نقطة البيع', 'cash', 0) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id UUID REFERENCES cash_boxes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in','out')),
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  ref_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS cash_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_box_id UUID REFERENCES cash_boxes(id) ON DELETE SET NULL,
  to_box_id UUID REFERENCES cash_boxes(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  box_id UUID REFERENCES cash_boxes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID
);

-- =====================
-- TOURNAMENTS
-- =====================
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'SINGLE_ELIM' CHECK (format IN ('SINGLE_ELIM')),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','COMPLETED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  seed INTEGER
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  round_name TEXT NOT NULL,
  round_num INTEGER NOT NULL,
  match_num INTEGER NOT NULL,
  team1_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  team2_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  score1 INTEGER,
  score2 INTEGER,
  winner_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  played_at TIMESTAMPTZ
);

-- =====================
-- USERS & ROLES
-- =====================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  permissions_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (name, permissions_json) VALUES ('Super Admin', '{"all": true}') ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shift_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opening_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(10,2),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  details_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- REALTIME
-- =====================
ALTER PUBLICATION supabase_realtime ADD TABLE screens;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
