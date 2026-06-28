export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// GenericTable requires Relationships field – use this wrapper for all tables
type T<Row, Ins, Upd> = {
  Row: Row
  Insert: Ins
  Update: Upd
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      settings: T<
        { key: string; value: string },
        { key: string; value?: string },
        { key?: string; value?: string }
      >
      sections: T<Section, Partial<Omit<Section, 'id'>>, Partial<Omit<Section, 'id'>>>
      device_types: T<DeviceType, Partial<Omit<DeviceType, 'id'>>, Partial<Omit<DeviceType, 'id'>>>
      play_modes: T<PlayMode, Partial<Omit<PlayMode, 'id'>>, Partial<Omit<PlayMode, 'id'>>>
      shifts: T<Shift, Partial<Omit<Shift, 'id'>>, Partial<Omit<Shift, 'id'>>>
      screens: T<Screen, {
        name?: string; section_id?: string | null; device_type_id?: string | null
        ip?: string | null; port?: number | null; secret?: string | null
        status?: Screen['status']; current_session_id?: string | null; created_at?: string
      }, Partial<Omit<Screen, 'id' | 'section' | 'device_type' | 'current_session'>>>
      price_matrix: T<PriceMatrix, Partial<Omit<PriceMatrix, 'id' | 'shift' | 'device_type' | 'play_mode'>>, Partial<Omit<PriceMatrix, 'id' | 'shift' | 'device_type' | 'play_mode'>>>
      sessions: T<Session, {
        screen_id?: string; play_mode_id?: string; customer_id?: string | null
        started_at?: string; ended_at?: string | null; total_amount?: number | null
        status?: Session['status']; shift_id?: string | null; user_id?: string | null
        notes?: string | null; created_at?: string
      }, Partial<Omit<Session, 'id' | 'screen' | 'play_mode' | 'customer'>>>
      categories: T<Category, Partial<Omit<Category, 'id'>>, Partial<Omit<Category, 'id'>>>
      products: T<Product, Partial<Omit<Product, 'id' | 'category'>>, Partial<Omit<Product, 'id' | 'category'>>>
      product_addons: T<ProductAddon, Partial<Omit<ProductAddon, 'id'>>, Partial<Omit<ProductAddon, 'id'>>>
      suppliers: T<Supplier, Partial<Omit<Supplier, 'id'>>, Partial<Omit<Supplier, 'id'>>>
      purchase_invoices: T<PurchaseInvoice, Partial<Omit<PurchaseInvoice, 'id' | 'supplier' | 'items'>>, Partial<Omit<PurchaseInvoice, 'id' | 'supplier' | 'items'>>>
      purchase_invoice_items: T<PurchaseInvoiceItem, Partial<Omit<PurchaseInvoiceItem, 'id' | 'product'>>, Partial<Omit<PurchaseInvoiceItem, 'id' | 'product'>>>
      inventory_counts: T<InventoryCount, Partial<Omit<InventoryCount, 'id'>>, Partial<Omit<InventoryCount, 'id'>>>
      inventory_count_items: T<InventoryCountItem, Partial<Omit<InventoryCountItem, 'id' | 'product'>>, Partial<Omit<InventoryCountItem, 'id' | 'product'>>>
      pos_orders: T<PosOrder, Partial<Omit<PosOrder, 'id' | 'items'>>, Partial<Omit<PosOrder, 'id' | 'items'>>>
      pos_order_items: T<PosOrderItem, Partial<Omit<PosOrderItem, 'id' | 'product'>>, Partial<Omit<PosOrderItem, 'id' | 'product'>>>
      customers: T<Customer, Partial<Omit<Customer, 'id'>>, Partial<Omit<Customer, 'id'>>>
      customer_transactions: T<CustomerTransaction, Partial<Omit<CustomerTransaction, 'id'>>, Partial<Omit<CustomerTransaction, 'id'>>>
      cash_boxes: T<CashBox, Partial<Omit<CashBox, 'id'>>, Partial<Omit<CashBox, 'id'>>>
      cash_transactions: T<CashTransaction, Partial<Omit<CashTransaction, 'id'>>, Partial<Omit<CashTransaction, 'id'>>>
      cash_transfers: T<CashTransfer, Partial<Omit<CashTransfer, 'id'>>, Partial<Omit<CashTransfer, 'id'>>>
      expenses: T<Expense, Partial<Omit<Expense, 'id'>>, Partial<Omit<Expense, 'id'>>>
      tournaments: T<Tournament, Partial<Omit<Tournament, 'id'>>, Partial<Omit<Tournament, 'id'>>>
      teams: T<Team, Partial<Omit<Team, 'id' | 'customer'>>, Partial<Omit<Team, 'id' | 'customer'>>>
      tournament_participants: T<TournamentParticipant, Partial<Omit<TournamentParticipant, 'id' | 'team'>>, Partial<Omit<TournamentParticipant, 'id' | 'team'>>>
      matches: T<Match, Partial<Omit<Match, 'id' | 'team1' | 'team2' | 'winner'>>, Partial<Omit<Match, 'id' | 'team1' | 'team2' | 'winner'>>>
      users: T<AppUser, Partial<Omit<AppUser, 'id' | 'role'>>, Partial<Omit<AppUser, 'id' | 'role'>>>
      roles: T<Role, Partial<Omit<Role, 'id'>>, Partial<Omit<Role, 'id'>>>
      shift_logs: T<ShiftLog, Partial<Omit<ShiftLog, 'id'>>, Partial<Omit<ShiftLog, 'id'>>>
      event_log: T<EventLog, Partial<Omit<EventLog, 'id'>>, Partial<Omit<EventLog, 'id'>>>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ---- Entities ----
// NOTE: Must use `type` (not `interface`) so they extend Record<string, unknown>
// which is required by Supabase's GenericTable['Row'] constraint.

export type Section = {
  id: string
  name: string
  sort_order: number
  created_at: string
}

export type DeviceType = {
  id: string
  name: string
  created_at: string
}

export type PlayMode = {
  id: string
  name: string
  players_count: number
  created_at: string
}

export type Shift = {
  id: string
  name: string
  start_time: string
  end_time: string
  created_at: string
}

export type Screen = {
  id: string
  name: string
  section_id: string | null
  device_type_id: string | null
  ip: string | null
  port: number | null
  secret: string | null
  status: 'available' | 'playing' | 'locked' | 'offline'
  current_session_id: string | null
  created_at: string
  // Joined
  section?: Section
  device_type?: DeviceType
  current_session?: Session
}

export type PriceMatrix = {
  id: string
  shift_id: string
  device_type_id: string
  play_mode_id: string
  price_per_hour: number
  // Joined
  shift?: Shift
  device_type?: DeviceType
  play_mode?: PlayMode
}

export type Session = {
  id: string
  screen_id: string
  play_mode_id: string
  customer_id: string | null
  started_at: string
  ended_at: string | null
  total_amount: number | null
  status: 'active' | 'ended' | 'cancelled'
  shift_id: string | null
  user_id: string | null
  notes: string | null
  created_at: string
  // Joined
  screen?: Screen
  play_mode?: PlayMode
  customer?: Customer
}

export type Category = {
  id: string
  name: string
  sort_order: number
  revenue_box_id: string | null
  created_at: string
}

export type Product = {
  id: string
  name: string
  sku: string | null
  category_id: string | null
  sale_price: number
  purchase_price: number
  quantity: number
  alert_qty: number
  status: 'active' | 'low' | 'out'
  created_at: string
  // Joined
  category?: Category
}

export type ProductAddon = {
  id: string
  name: string
  additional_price: number
  enabled: boolean
  created_at: string
}

export type Supplier = {
  id: string
  name: string
  phone: string | null
  created_at: string
}

export type PurchaseInvoice = {
  id: string
  supplier_id: string | null
  inv_number: string
  inv_date: string
  total: number
  cash_on_delivery: boolean
  user_id: string | null
  created_at: string
  // Joined
  supplier?: Supplier
  items?: PurchaseInvoiceItem[]
}

export type PurchaseInvoiceItem = {
  id: string
  invoice_id: string
  product_id: string
  qty: number
  unit_cost: number
  // Joined
  product?: Product
}

export type InventoryCount = {
  id: string
  started_at: string
  finalized_at: string | null
  status: 'draft' | 'finalized'
  user_id: string | null
}

export type InventoryCountItem = {
  id: string
  count_id: string
  product_id: string
  system_qty: number
  counted_qty: number
  // Joined
  product?: Product
}

export type PosOrder = {
  id: string
  created_at: string
  total: number
  payment_type: 'cash' | 'session' | 'customer_debt'
  table_name: string | null
  session_id: string | null
  shift_id: string | null
  customer_id: string | null
  user_id: string | null
  status: 'completed' | 'refunded'
  items?: PosOrderItem[]
}

export type PosOrderItem = {
  id: string
  order_id: string
  product_id: string
  qty: number
  unit_price: number
  addons_json: Json
  // Joined
  product?: Product
}

export type Customer = {
  id: string
  name: string
  phone: string | null
  username: string | null
  password_hash: string | null
  balance: number
  created_at: string
}

export type CustomerTransaction = {
  id: string
  customer_id: string
  type: 'debt_added' | 'payment' | 'opening_balance' | 'refund'
  amount: number
  description: string | null
  ref_id: string | null
  created_at: string
  cancelled: boolean
  user_id: string | null
}

export type CashBox = {
  id: string
  name: string
  type: 'cash' | 'safe'
  balance: number
  created_at: string
}

export type CashTransaction = {
  id: string
  box_id: string
  type: 'in' | 'out'
  amount: number
  description: string | null
  ref_id: string | null
  created_at: string
  cancelled: boolean
}

export type CashTransfer = {
  id: string
  from_box_id: string
  to_box_id: string
  amount: number
  note: string | null
  created_at: string
  user_id: string | null
}

export type Expense = {
  id: string
  amount: number
  description: string | null
  box_id: string | null
  created_at: string
  user_id: string | null
}

export type Tournament = {
  id: string
  name: string
  format: 'SINGLE_ELIM'
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED'
  created_at: string
}

export type Team = {
  id: string
  name: string
  customer_id: string | null
  created_at: string
  customer?: Customer
}

export type TournamentParticipant = {
  id: string
  tournament_id: string
  team_id: string
  seed: number | null
  team?: Team
}

export type Match = {
  id: string
  tournament_id: string
  round_name: string
  round_num: number
  match_num: number
  team1_id: string | null
  team2_id: string | null
  score1: number | null
  score2: number | null
  winner_id: string | null
  played_at: string | null
  team1?: Team
  team2?: Team
  winner?: Team
}

export type AppUser = {
  id: string
  name: string
  username: string
  password_hash: string
  role_id: string | null
  created_at: string
  role?: Role
}

export type Role = {
  id: string
  name: string
  permissions_json: Json
  created_at: string
}

export type ShiftLog = {
  id: string
  user_id: string | null
  shift_id: string | null
  opened_at: string
  closed_at: string | null
  opening_balance: number
  closing_balance: number | null
  notes: string | null
}

export type EventLog = {
  id: string
  user_id: string | null
  action: string
  details_json: Json
  created_at: string
}
