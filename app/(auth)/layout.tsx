import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="hidden w-1/2 flex-col justify-between bg-ink-950 p-10 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold">U</span>
          <span className="text-sm font-semibold">Pembukuan UMKM</span>
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">
            Pembukuan rapi, stok akurat, kas terkendali.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-400">
            Catat kas masuk/keluar, transaksi kasir, inventaris, serta utang-piutang dalam satu
            aplikasi. Dirancang untuk pemilik UMKM tanpa latar belakang akuntansi.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-ink-300">
            <li>· Ringkasan kas real-time setiap saat</li>
            <li>· POS sederhana dengan struk siap cetak</li>
            <li>· Laporan laba rugi & arus kas siap ekspor</li>
          </ul>
        </div>
        <p className="text-xs text-ink-500">© {new Date().getFullYear()} Pembukuan UMKM</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              U
            </span>
            <span className="text-sm font-semibold text-ink-900">Pembukuan UMKM</span>
          </div>
          {children}
          <p className="mt-6 text-center text-xs text-ink-500">
            butuh bantuan?{" "}
            <Link href="/lupa-password" className="font-medium text-brand-600 hover:text-brand-700">
              Lupa password
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
