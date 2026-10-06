"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatRupiah } from "@/lib/format";

export interface CashflowPoint {
  date: string;
  label: string;
  masuk: number;
  keluar: number;
}

export function CashflowChart({ data }: { data: CashflowPoint[] }) {
  const [range, setRange] = useState<7 | 30>(30);
  const visible = range === 7 ? data.slice(-7) : data;

  return (
    <div className="rounded-card border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-ink-900">Arus kas</h2>
          <p className="text-xs text-ink-500">Perbandingan uang masuk vs keluar harian</p>
        </div>
        <div className="flex rounded-lg border border-ink-200 p-0.5">
          {([7, 30] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                range === value ? "bg-brand-600 text-white" : "text-ink-500 hover:text-ink-800"
              }`}
            >
              {value} hari
            </button>
          ))}
        </div>
      </div>
      <div className="h-72 px-2 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visible} margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="masuk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="keluar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ec" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              width={70}
              tickFormatter={(value: number) => formatRupiah(value).replace("Rp", "")}
            />
            <Tooltip
              formatter={(value) => [formatRupiah(Number(value)), ""]}
              labelFormatter={(label) => `Tanggal ${label}`}
              contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e6e8ec" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="masuk" name="Masuk" stroke="#4f46e5" strokeWidth={2} fill="url(#masuk)" />
            <Area type="monotone" dataKey="keluar" name="Keluar" stroke="#ef4444" strokeWidth={2} fill="url(#keluar)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
