-- ============================================================================
-- UMKM Ledger — RPC transaksi (Supabase)
-- Semua fungsi berjalan security definer agar satu aksi = satu transaksi
-- database atomik (kas, stok, utang, dan jurnal diperbarui bersamaan).
-- ============================================================================

-- ─── Kas masuk / kas keluar ──────────────────────────────────────────────────

create or replace function public.record_cash(
  p_type text,
  p_amount numeric,
  p_category_id uuid,
  p_bank_account_id uuid,
  p_party_id uuid,
  p_notes text,
  p_date date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_invoice text;
  v_seq bigint;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Nominal harus lebih dari 0';
  end if;
  if p_type not in ('INCOME', 'EXPENSE') then
    raise exception 'Tipe transaksi tidak valid';
  end if;
  if p_bank_account_id is null then
    raise exception 'Pilih sumber dana';
  end if;

  select count(*) + 1 into v_seq
    from transactions
   where type = p_type
     and transaction_date >= date_trunc('month', current_date)::date;

  v_invoice := case when p_type = 'INCOME' then 'KMS' else 'KLR' end
    || '-' || to_char(current_date, 'yyyymm')
    || '-' || lpad(v_seq::text, 3, '0');

  insert into transactions (
    type, invoice_no, transaction_date, category_id, party_id,
    bank_account_id, total_amount, payment_method, payment_status, notes
  ) values (
    p_type, v_invoice, coalesce(p_date, current_date), p_category_id, p_party_id,
    p_bank_account_id, p_amount, 'CASH', 'PAID', coalesce(p_notes, '')
  )
  returning id into v_id;

  update bank_accounts
     set balance = balance + case when p_type = 'INCOME' then p_amount else -p_amount end
   where id = p_bank_account_id;

  return v_id;
end;
$$;

-- ─── Penjualan (POS) ─────────────────────────────────────────────────────────

create or replace function public.record_sale(
  p_items jsonb,
  p_discount numeric,
  p_payment_method text,
  p_bank_account_id uuid,
  p_party_id uuid,
  p_notes text,
  p_allow_stock_override boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_invoice text;
  v_seq bigint;
  v_total numeric := 0;
  v_grand numeric;
  v_is_tempo boolean := (p_payment_method = 'TEMPO');
  v_item jsonb;
  v_product record;
  v_qty numeric;
  v_discount numeric;
  v_subtotal numeric;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang masih kosong';
  end if;

  select count(*) + 1 into v_seq
    from transactions
   where type = 'SALE'
     and transaction_date >= date_trunc('month', current_date)::date;

  v_invoice := 'INV-' || to_char(current_date, 'yyyymm')
    || '-' || lpad(v_seq::text, 3, '0');

  insert into transactions (
    type, invoice_no, transaction_date, party_id, bank_account_id,
    total_amount, discount, payment_method, payment_status, notes
  ) values (
    'SALE', v_invoice, current_date, p_party_id, p_bank_account_id,
    0, coalesce(p_discount, 0), p_payment_method,
    case when v_is_tempo then 'UNPAID' else 'PAID' end,
    coalesce(p_notes, '')
  )
  returning id into v_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product
      from products
     where id = (v_item ->> 'product_id')::uuid
     for update;

    if not found then
      raise exception 'Produk tidak ditemukan';
    end if;

    v_qty := coalesce((v_item ->> 'qty')::numeric, 0);
    v_discount := coalesce((v_item ->> 'discount')::numeric, 0);

    if v_qty <= 0 then
      raise exception 'Qty % tidak valid', v_product.name;
    end if;
    if coalesce(p_allow_stock_override, false) = false and v_product.stock_qty < v_qty then
      raise exception 'Stok % tidak cukup (tersisa %)', v_product.name, v_product.stock_qty;
    end if;

    v_subtotal := v_product.sell_price * v_qty - v_discount;
    v_total := v_total + v_subtotal;

    insert into transaction_items (
      transaction_id, product_id, product_name, qty, unit_price, discount, subtotal
    ) values (
      v_id, v_product.id, v_product.name, v_qty, v_product.sell_price, v_discount, v_subtotal
    );

    update products set stock_qty = stock_qty - v_qty where id = v_product.id;

    insert into stock_movements (product_id, type, qty_change, stock_after, reference, reason)
    values (v_product.id, 'OUT', -v_qty, v_product.stock_qty - v_qty, v_invoice, 'Penjualan');
  end loop;

  v_grand := greatest(v_total - coalesce(p_discount, 0), 0);
  update transactions set total_amount = v_grand where id = v_id;

  if not v_is_tempo then
    update bank_accounts set balance = balance + v_grand where id = p_bank_account_id;
  elsif v_is_tempo and p_party_id is not null then
    insert into debts (type, party_id, transaction_id, total_amount, paid_amount, due_date, status)
    values ('RECEIVABLE', p_party_id, v_id, v_grand, 0, current_date + 14, 'OPEN');

    update parties set balance = balance + v_grand where id = p_party_id;
  end if;

  return jsonb_build_object('id', v_id, 'invoice_no', v_invoice);
end;
$$;

-- ─── Pembelian ───────────────────────────────────────────────────────────────

create or replace function public.record_purchase(
  p_party_id uuid,
  p_items jsonb,
  p_payment_method text,
  p_bank_account_id uuid,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_invoice text;
  v_seq bigint;
  v_total numeric := 0;
  v_is_tempo boolean := (p_payment_method = 'TEMPO');
  v_item jsonb;
  v_product record;
  v_qty numeric;
  v_unit_cost numeric;
  v_stock_after numeric;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Daftar item masih kosong';
  end if;
  if p_party_id is null then
    raise exception 'Pilih pemasok';
  end if;

  select count(*) + 1 into v_seq
    from transactions
   where type = 'PURCHASE'
     and transaction_date >= date_trunc('month', current_date)::date;

  v_invoice := 'PUK-' || to_char(current_date, 'yyyymm')
    || '-' || lpad(v_seq::text, 3, '0');

  insert into transactions (
    type, invoice_no, transaction_date, party_id, bank_account_id,
    total_amount, payment_method, payment_status, notes
  ) values (
    'PURCHASE', v_invoice, current_date, p_party_id, p_bank_account_id,
    0, p_payment_method,
    case when v_is_tempo then 'UNPAID' else 'PAID' end,
    coalesce(p_notes, '')
  )
  returning id into v_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product
      from products
     where id = (v_item ->> 'product_id')::uuid
     for update;

    if not found then
      raise exception 'Produk tidak ditemukan';
    end if;

    v_qty := coalesce((v_item ->> 'qty')::numeric, 0);
    v_unit_cost := coalesce((v_item ->> 'unit_cost')::numeric, v_product.cost_price);

    if v_qty <= 0 then
      raise exception 'Qty % tidak valid', v_product.name;
    end if;

    v_total := v_total + v_unit_cost * v_qty;

    insert into transaction_items (
      transaction_id, product_id, product_name, qty, unit_price, discount, subtotal
    ) values (
      v_id, v_product.id, v_product.name, v_qty, v_unit_cost, 0, v_unit_cost * v_qty
    );

    v_stock_after := v_product.stock_qty + v_qty;
    update products
       set stock_qty = v_stock_after,
           cost_price = v_unit_cost
     where id = v_product.id;

    insert into stock_movements (product_id, type, qty_change, stock_after, reference, reason)
    values (v_product.id, 'IN', v_qty, v_stock_after, v_invoice, 'Pembelian');
  end loop;

  update transactions set total_amount = v_total where id = v_id;

  if not v_is_tempo then
    update bank_accounts set balance = balance - v_total where id = p_bank_account_id;
  else
    insert into debts (type, party_id, transaction_id, total_amount, paid_amount, due_date, status)
    values ('PAYABLE', p_party_id, v_id, v_total, 0, current_date + 14, 'OPEN');

    update parties set balance = balance - v_total where id = p_party_id;
  end if;

  return v_id;
end;
$$;

-- ─── Penyesuaian stok ────────────────────────────────────────────────────────

create or replace function public.adjust_stock(
  p_product_id uuid,
  p_qty_change numeric,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product record;
  v_after numeric;
begin
  if p_qty_change is null or p_qty_change = 0 then
    raise exception 'Selisih stok tidak boleh 0';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'Alasan penyesuaian wajib diisi';
  end if;

  select * into v_product from products where id = p_product_id for update;
  if not found then
    raise exception 'Produk tidak ditemukan';
  end if;

  v_after := v_product.stock_qty + p_qty_change;
  if v_after < 0 then
    raise exception 'Stok % tidak boleh negatif', v_product.name;
  end if;

  update products set stock_qty = v_after where id = p_product_id;

  insert into stock_movements (product_id, type, qty_change, stock_after, reference, reason)
  values (p_product_id, 'ADJUSTMENT', p_qty_change, v_after, 'PENYESUAIAN', p_reason);
end;
$$;

-- ─── Pelunasan utang / piutang ───────────────────────────────────────────────

create or replace function public.pay_debt(
  p_debt_id uuid,
  p_amount numeric,
  p_bank_account_id uuid,
  p_notes text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_debt record;
  v_outstanding numeric;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Nominal pembayaran harus lebih dari 0';
  end if;

  select * into v_debt from debts where id = p_debt_id for update;
  if not found then
    raise exception 'Data utang/piutang tidak ditemukan';
  end if;

  v_outstanding := v_debt.total_amount - v_debt.paid_amount;
  if p_amount > v_outstanding then
    raise exception 'Melebihi sisa tagihan';
  end if;

  insert into debt_payments (debt_id, amount, bank_account_id, notes)
  values (p_debt_id, p_amount, p_bank_account_id, coalesce(p_notes, ''));

  update debts
     set paid_amount = paid_amount + p_amount,
         status = case when paid_amount + p_amount >= total_amount then 'PAID' else 'PARTIAL' end
   where id = p_debt_id;

  update bank_accounts
     set balance = balance + case when v_debt.type = 'RECEIVABLE' then p_amount else -p_amount end
   where id = p_bank_account_id;

  update parties
     set balance = balance + case when v_debt.type = 'RECEIVABLE' then -p_amount else p_amount end
   where id = v_debt.party_id;
end;
$$;

-- ─── Hak akses fungsi ────────────────────────────────────────────────────────

revoke execute on function public.record_cash(text, numeric, uuid, uuid, uuid, text, date) from public, anon;
revoke execute on function public.record_sale(jsonb, numeric, text, uuid, uuid, text, boolean) from public, anon;
revoke execute on function public.record_purchase(uuid, jsonb, text, uuid, text) from public, anon;
revoke execute on function public.adjust_stock(uuid, numeric, text) from public, anon;
revoke execute on function public.pay_debt(uuid, numeric, uuid, text) from public, anon;

grant execute on function public.record_cash(text, numeric, uuid, uuid, uuid, text, date) to authenticated;
grant execute on function public.record_sale(jsonb, numeric, text, uuid, uuid, text, boolean) to authenticated;
grant execute on function public.record_purchase(uuid, jsonb, text, uuid, text) to authenticated;
grant execute on function public.adjust_stock(uuid, numeric, text) to authenticated;
grant execute on function public.pay_debt(uuid, numeric, uuid, text) to authenticated;
