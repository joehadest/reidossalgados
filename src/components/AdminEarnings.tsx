"use client";
import React, { useEffect, useState, useCallback } from 'react';

interface DayEarning { date: string; totalOrders: number; totalRevenue: number; avgTicket: number; }
interface EarningsResponse { success: boolean; data: DayEarning[]; summary: { totalDays: number; totalOrders: number; totalRevenue: number; avgTicket: number; }; }

function formatCurrency(value: number) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

const rangeButtons = [
  { label: 'Ontem', action: () => { const d = new Date(); d.setDate(d.getDate()-1); const iso = d.toISOString().slice(0,10); return { start: iso, end: iso }; } },
  { label: 'Hoje', action: () => { const d = new Date(); const iso = d.toISOString().slice(0,10); return { start: iso, end: iso }; } },
  { label: 'Esta Semana', action: () => { const now = new Date(); const day = now.getDay(); const diffToMonday = (day === 0 ? 6 : day - 1); const start = new Date(now); start.setDate(now.getDate()-diffToMonday); const end = now; return { start: start.toISOString().slice(0,10), end: end.toISOString().slice(0,10) }; } },
  { label: 'Mês Atual', action: () => { const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), 1); const end = now; return { start: start.toISOString().slice(0,10), end: end.toISOString().slice(0,10) }; } },
];

const presetRanges: { label: string; days: number }[] = [ { label: '7d', days: 7 }, { label: '15d', days: 15 }, { label: '30d', days: 30 } ];

export default function AdminEarnings() {
  const [start, setStart] = useState<string>(() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().slice(0,10); });
  const [end, setEnd] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [data, setData] = useState<DayEarning[]>([]);
  const [summary, setSummary] = useState<EarningsResponse['summary'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ start, end });
      const res = await fetch(`/api/pedidos/earnings?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Falha ao buscar ganhos');
      const json: EarningsResponse = await res.json();
      if (!json.success) throw new Error('Resposta inválida');
      setData(json.data); setSummary(json.summary);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, [start, end]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const applyPreset = (days: number) => { const endDate = new Date(); const startDate = new Date(); startDate.setDate(endDate.getDate() - (days - 1)); setStart(startDate.toISOString().slice(0,10)); setEnd(endDate.toISOString().slice(0,10)); };
  const applyRangeButton = (fn: () => { start: string; end: string }) => { const r = fn(); setStart(r.start); setEnd(r.end); };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Ganhos por Dia</h2>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm mb-1">Início</label>
          <input type="date" value={start} onChange={e => setStart(e.target.value)} className="border rounded px-2 py-1 bg-neutral-900 border-neutral-700" />
        </div>
        <div>
          <label className="block text-sm mb-1">Fim</label>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="border rounded px-2 py-1 bg-neutral-900 border-neutral-700" />
        </div>
        <button onClick={() => fetchData()} disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded text-sm font-medium">Atualizar</button>
        <div className="flex flex-wrap gap-2">
          {rangeButtons.map(b => (
            <button key={b.label} onClick={() => applyRangeButton(b.action)} className="px-3 py-1 text-xs rounded border border-neutral-700 hover:bg-neutral-800">
              {b.label}
            </button>
          ))}
          {presetRanges.map(p => (
            <button key={p.days} onClick={() => applyPreset(p.days)} className="px-3 py-1 text-xs rounded border border-neutral-700 hover:bg-neutral-800">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="text-red-400 text-sm">{error}</div>}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded bg-neutral-800 border border-neutral-700"><div className="text-xs uppercase text-neutral-400">Pedidos</div><div className="text-lg font-bold">{summary.totalOrders}</div></div>
          <div className="p-3 rounded bg-neutral-800 border border-neutral-700"><div className="text-xs uppercase text-neutral-400">Faturamento</div><div className="text-lg font-bold">{formatCurrency(summary.totalRevenue)}</div></div>
            <div className="p-3 rounded bg-neutral-800 border border-neutral-700"><div className="text-xs uppercase text-neutral-400">Ticket Médio</div><div className="text-lg font-bold">{formatCurrency(summary.avgTicket)}</div></div>
          <div className="p-3 rounded bg-neutral-800 border border-neutral-700"><div className="text-xs uppercase text-neutral-400">Dias</div><div className="text-lg font-bold">{summary.totalDays}</div></div>
        </div>
      )}

      <div className="overflow-x-auto border border-neutral-700 rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-800"><tr><th className="px-3 py-2 text-left font-medium">Data</th><th className="px-3 py-2 text-right font-medium">Pedidos</th><th className="px-3 py-2 text-right font-medium">Faturamento</th><th className="px-3 py-2 text-right font-medium">Ticket Médio</th></tr></thead>
          <tbody>
            {loading && (<tr><td colSpan={4} className="px-3 py-6 text-center text-neutral-400">Carregando...</td></tr>)}
            {!loading && data.length === 0 && (<tr><td colSpan={4} className="px-3 py-6 text-center text-neutral-400">Sem dados</td></tr>)}
            {!loading && data.map(day => (
              <tr key={day.date} className="odd:bg-neutral-900 even:bg-neutral-950 border-t border-neutral-800">
                <td className="px-3 py-2 whitespace-nowrap">{day.date.split('-').reverse().join('/')}</td>
                <td className="px-3 py-2 text-right">{day.totalOrders}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(day.totalRevenue)}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(day.avgTicket)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
