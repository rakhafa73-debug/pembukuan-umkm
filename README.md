# Pembukuan UMKM — Web App

Aplikasi pembukuan lengkap untuk UMKM: kas masuk/keluar, POS penjualan, pembelian, inventaris & kartu stok, pelanggan/pemasok (piutang–utang), laporan laba rugi/arus kas, serta pengaturan profil bisnis, staf, dan akun keuangan.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** (token warna di `app/globals.css`)
- **TanStack Table v9** (tabel inventaris interaktif: sort, filter, paginasi)
- **Recharts** (grafik arus kas), **jsPDF + AutoTable** & **ExcelJS** (ekspor laporan)
- **Supabase** (auth + Postgres + RPC) — opsional

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run build
```

### Mode demo (default — tanpa Supabase)

Tanpa `.env`, aplikasi berjalan penuh dengan data seed in-memory (`lib/data/store.ts`):
login sebagai owner demo, semua transaksi tersimpan di memori (reset saat restart).

### Mode Supabase

1. Salin `.env.example` ke `.env.local` lalu isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Jalankan dua migration di Supabase SQL Editor (berurutan):
   - `supabase/migrations/0001_schema.sql` — tabel, trigger, RLS, data awal
   - `supabase/migrations/0002_rpcs.sql` — fungsi `record_cash`, `record_sale`, `record_purchase`, `adjust_stock`, `pay_debt`
3. Daftar lewat `/register` → isi onboarding → aplikasi siap dipakai.

Semua penulisan transaksi berjalan lewat RPC (satu aksi = satu transaksi database atomik: kas, stok, utang, dan jurnal diperbarui bersamaan).

## Rute

| Rute | Fungsi |
| --- | --- |
| `/login`, `/register`, `/lupa-password` | Autentikasi |
| `/onboarding` | Pembuatan profil bisnis |
| `/dashboard` | Ringkasan, grafik arus kas, peringatan |
| `/transaksi`, `/transaksi/baru` | Kas masuk & keluar + filter |
| `/pos` | Kasir penjualan + struk |
| `/pembelian` | Pembelian ke pemasok |
| `/inventaris`, `/inventaris/[id]` | Produk, penyesuaian stok, kartu stok |
| `/pihak`, `/pihak/[id]` | Pelanggan/pemasok + pelunasan piutang/utang |
| `/laporan` | Laba rugi, arus kas, piutang–utang, penjualan, persediaan (PDF/Excel/cetak) |
| `/pengaturan/profil`, `/staf`, `/akun-bank` | Pengaturan bisnis, role staf, akun dana |

## Role

`owner` (akses penuh) · `admin` (transaksi, laporan, pengaturan) · `staff` (POS, transaksi, inventaris; tanpa laporan/pengaturan). Guard ada di `lib/session.ts` (`requireRole`).

## Struktur

```
app/            # rute (auth, onboarding, dashboard, laporan, pengaturan)
components/     # ui kit, layout, fitur per modul
lib/
  actions.ts    # semua server action (mock & Supabase)
  data/         # pembacaan data dual-path + store seed
  session.ts    # session & guard role
  supabase/     # client/server SSR
supabase/       # migrations SQL
```

## Catatan implementasi

- Tanpa Supabase, `proxy.ts` memberi sesi demo owner dan semua rute terbuka.
- Filter tanggal laporan/transaksi pada mode Supabase memakai kolom `transaction_date` bertipe `date`.
- Pemindaian data belum difilter per `business_id` di semua query (asumsi satu bisnis per deployment); kolom `business_id` sudah tersedia di skema untuk pengembangan multi-tenant.
- Undangan staf disimpan sebagai anggota berstatus `INVITED`; aktivasi akunnya mengikuti pendaftaran Supabase Auth.
