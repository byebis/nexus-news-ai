'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Newspaper, Send, Hourglass, Star, TrendingUp, Bot, Activity, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORY_META } from '@/lib/categories';
import { useToast } from '@/hooks/use-toast';

interface StatsData {
  totals: {
    articles: number; published: number; approved: number; pending: number; rejected: number;
    published7d: number; agents: number; activeAgents: number; avgQuality: number;
    successRate: number; errors7d: number; operations7d: number;
  };
  byCategory: Record<string, number>;
  perDay: Array<{ date: string; count: number }>;
  agents: Array<{ name: string; category: string; articles: number; avgScore: number; status: string; lastRun: string | null }>;
}

const COLORS = ['#06b6d4', '#6366f1', '#f59e0b', '#3b82f6', '#22c55e', '#f43f5e', '#0ea5e9'];

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StatsPanel() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => (d.error ? Promise.reject(new Error(d.error)) : setData(d)))
      .catch((e) => toast({ title: 'Errore statistiche', description: String(e.message || e).slice(0, 120), variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Calcolo statistiche...</div>;
  }
  if (!data) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Statistiche non disponibili.</div>;
  }

  const pieData = Object.entries(data.byCategory).map(([name, value]) => ({ name, value }));
  const dayData = data.perDay.map((d) => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
  }));

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Newspaper className="h-5 w-5" />} label="Articoli totali" value={data.totals.articles} sub={`${data.totals.published} pubblicati`} />
        <StatCard icon={<Send className="h-5 w-5" />} label="Pubblicati (7 gg)" value={data.totals.published7d} sub={`${data.totals.pending} in coda`} />
        <StatCard icon={<Star className="h-5 w-5" />} label="Qualità media" value={`${data.totals.avgQuality}%`} sub="punteggio editoriale" />
        <StatCard icon={<Bot className="h-5 w-5" />} label="Agenti attivi" value={`${data.totals.activeAgents}/${data.totals.agents}`} sub={`${data.totals.operations7d} operazioni (7 gg)`} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Articles per day */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-primary" /> Articoli generati (14 giorni)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayData} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" fill={COLORS[0]} radius={[4, 4, 0, 0]} name="Articoli" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-primary" /> Articoli per categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {pieData.map((entry, i) => (
                      <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent leaderboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-primary" /> Classifica agenti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="pb-2 pr-3 font-medium">Agente</th>
                  <th className="pb-2 pr-3 font-medium">Categoria</th>
                  <th className="pb-2 pr-3 font-medium">Articoli</th>
                  <th className="pb-2 pr-3 font-medium">Qualità media</th>
                  <th className="pb-2 font-medium">Ultimo run</th>
                </tr>
              </thead>
              <tbody>
                {data.agents.map((a) => (
                  <tr key={a.name} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{a.name}</td>
                    <td className="py-2 pr-3">
                      <span className="mr-1">{(CATEGORY_META[a.category] || CATEGORY_META.default).emoji}</span>
                      {a.category}
                    </td>
                    <td className="py-2 pr-3">{a.articles}</td>
                    <td className="py-2 pr-3">
                      <span className={a.avgScore >= 70 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : a.avgScore > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}>
                        {a.avgScore > 0 ? `${a.avgScore}%` : '—'}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground text-xs">
                      {a.lastRun ? new Date(a.lastRun).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'mai'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
