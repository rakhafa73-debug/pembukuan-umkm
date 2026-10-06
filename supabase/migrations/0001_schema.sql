-- ============================================================================
-- UMKM Ledger — skema dasar (Supabase / PostgreSQL)
-- Jalankan di Supabase SQL Editor atau lewat `supabase db push`.
-- ============================================================================

create extension if not exists pgcrypto;

-- ─── Organisasi & pengguna ───────────────────────────────────────────────────

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_name text not null,
  category text not null default 'Lainnya',
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  name text not null default '',
  email text not null default '',
  role text not null default 'staff' check (role in ('owner', 'admin', 'staff')),
  status text not null default 'INVITED' check (status in ('INVITED', 'ACTIVE', 'DISABLED')),
  joined_at date not null default current_date
);

create index if not exists idx_business_members_business on business_members (business_id);
create index if not exists idx_business_members_user on business_members (user_id);

-- Isi profil otomatis saat user mendaftar (full_name dari metadata signup)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Master data ─────────────────────────────────────────────────────────────

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses (id) on delete cascade,
  kind text not null check (kind in ('INCOME', 'EXPENSE', 'PRODUCT')),
  name text not null
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses (id) on delete cascade,
  sku text not null,
  barcode text not null default '',
  name text not null,
  category_id uuid references categories (id) on delete set null,
  unit text not null default 'pcs',
  cost_price numeric not null default 0,
  sell_price numeric not null default 0,
  stock_qty numeric not null default 0,
  min_stock numeric not null default 0,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  image_url text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_products_sku on products (sku);

create table if not exists parties (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'CUSTOMER' check (type in ('CUSTOMER', 'SUPPLIER', 'BOTH')),
  name text not null,
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  notes text not null default '',
  balance numeric not null default 0,
  created_at date not null default current_date
);

create table if not exists bank_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses (id) on delete cascade,
  name text not null,
  type text not null default 'BANK' check (type in ('CASH', 'BANK', 'EWALLET')),
  opening_balance numeric not null default 0,
  balance numeric not null default 0,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE'))
);

-- Saldo mengikuti saldo awal saat akun dibuat / saldo awal diubah
create or replace function public.bank_accounts_apply_opening()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' and coalesce(new.balance, 0) = 0 and coalesce(new.opening_balance, 0) <> 0 then
    new.balance := new.opening_balance;
  end if;
  if tg_op = 'UPDATE' and new.opening_balance is distinct from old.opening_balance then
    new.balance := coalesce(new.balance, 0) + (coalesce(new.opening_balance, 0) - coalesce(old.opening_balance, 0));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bank_accounts_apply_opening on bank_accounts;
create trigger trg_bank_accounts_apply_opening
  before insert or update on bank_accounts
  for each row execute function public.bank_accounts_apply_opening();

-- ─── Transaksi ───────────────────────────────────────────────────────────────

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('INCOME', 'EXPENSE', 'SALE', 'PURCHASE')),
  invoice_no text not null,
  transaction_date date not null default current_date,
  category_id uuid references categories (id) on delete set null,
  party_id uuid references parties (id) on delete set null,
  bank_account_id uuid references bank_accounts (id),
  total_amount numeric not null default 0,
  discount numeric not null default 0,
  payment_method text not null default 'CASH' check (payment_method in ('CASH', 'TRANSFER', 'QRIS', 'TEMPO')),
  payment_status text not null default 'PAID' check (payment_status in ('PAID', 'PARTIAL', 'UNPAID')),
  notes text not null default '',
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_date on transactions (transaction_date desc, created_at desc);
create index if not exists idx_transactions_type on transactions (type);

create table if not exists transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  product_name text not null default '',
  qty numeric not null default 1,
  unit_price numeric not null default 0,
  discount numeric not null default 0,
  subtotal numeric not null default 0
);

create index if not exists idx_transaction_items_tx on transaction_items (transaction_id);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  type text not null check (type in ('IN', 'OUT', 'ADJUSTMENT', 'OPENING')),
  qty_change numeric not null,
  stock_after numeric not null,
  reference text not null default '',
  reason text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_movements_product on stock_movements (product_id, created_at desc);

-- Kartu stok terisi otomatis saat produk baru dibuat dengan saldo awal
create or replace function public.products_seed_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.stock_qty, 0) <> 0 then
    insert into public.stock_movements (product_id, type, qty_change, stock_after, reference, reason)
    values (new.id, 'OPENING', new.stock_qty, new.stock_qty, 'SALDO AWAL', 'Produk baru');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_products_seed_movement on products;
create trigger trg_products_seed_movement
  after insert on products
  for each row execute function public.products_seed_movement();

create table if not exists debts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('PAYABLE', 'RECEIVABLE')),
  party_id uuid not null references parties (id) on delete cascade,
  transaction_id uuid references transactions (id) on delete set null,
  total_amount numeric not null default 0,
  paid_amount numeric not null default 0,
  due_date date not null default current_date + 14,
  status text not null default 'OPEN' check (status in ('OPEN', 'PARTIAL', 'PAID'))
);

create index if not exists idx_debts_party on debts (party_id);
create index if not exists idx_debts_status on debts (status);

create table if not exists debt_payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references debts (id) on delete cascade,
  amount numeric not null,
  paid_at timestamptz not null default now(),
  bank_account_id uuid references bank_accounts (id),
  notes text not null default ''
);

create index if not exists idx_debt_payments_debt on debt_payments (debt_id, paid_at desc);

-- ─── Notifikasi ──────────────────────────────────────────────────────────────

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses (id) on delete cascade,
  kind text not null check (kind in ('STOCK', 'DUE', 'SYSTEM')),
  title text not null,
  body text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Aplikasi selalu membaca/menulis lewat sesi login (role authenticated) dan
-- melakukan pemindaian data tingkat aplikasi, sehingga setiap tabel diberi
-- akses penuh untuk role authenticated. Anon tidak mendapat akses apa pun.

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'businesses', 'profiles', 'business_members',
    'categories', 'products', 'parties', 'bank_accounts',
    'transactions', 'transaction_items', 'stock_movements',
    'debts', 'debt_payments', 'notifications'
  ]
  loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('drop policy if exists "authenticated full access" on public.%I', tbl);
    execute format(
      'create policy "authenticated full access" on public.%I for all to authenticated using (true) with check (true)',
      tbl
    );
  end loop;
end $$;

-- ─── Data awal ───────────────────────────────────────────────────────────────

insert into categories (kind, name)
select v.kind, v.name
from (values
  ('INCOME', 'Lain-lain'),
  ('INCOME', 'Jasa'),
  ('EXPENSE', 'Operasional'),
  ('EXPENSE', 'Gaji'),
  ('EXPENSE', 'Sewa'),
  ('EXPENSE', 'Listrik & Air'),
  ('EXPENSE', 'Lain-lain'),
  ('PRODUCT', 'Umum')
) as v(kind, name)
where not exists (
  select 1 from categories c where c.kind = v.kind and c.name = v.name
);

insert into bank_accounts (name, type, opening_balance, balance)
select 'Kas Tunai', 'CASH', 0, 0
where not exists (select 1 from bank_accounts where name = 'Kas Tunai');
