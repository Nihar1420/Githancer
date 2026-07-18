'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Navbar } from '@/components/layout/Navbar';
import { LoadingState, ErrorState } from '@/components/ui/States';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function hourLabel(h: number): string {
  return `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gtm-border bg-gtm-surface p-5">
      <div className="text-2xl font-bold text-slate-100">{value}</div>
      <div className="mt-1 text-sm text-gtm-muted">{label}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, isError, refetch } = useAnalytics(id);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <LoadingState />
        </main>
      </>
    );
  }
  if (isError || !data) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <ErrorState message="Could not load analytics." onRetry={() => refetch()} />
        </main>
      </>
    );
  }

  const maxCell = Math.max(1, ...data.activeHours.map((c) => c.count));
  const cellCount = (day: number, hour: number) =>
    data.activeHours.find((c) => c.day === day && c.hour === hour)?.count ?? 0;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href={`/projects/${id}`} className="text-sm text-gtm-accent hover:underline">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-slate-100">Analytics</h1>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Metric label="Total commits" value={data.totalCommits} />
          <Metric label="Completed" value={data.completed} />
          <Metric label="Longest streak" value={data.longestStreak} />
          <Metric label="Peak hour" value={hourLabel(data.peakHour)} />
        </div>

        <div className="mb-6 rounded-xl border border-gtm-border bg-gtm-surface p-5">
          <h2 className="mb-4 text-sm font-medium text-slate-200">Daily commits</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.dailyCommits}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(d: string) => String(d).slice(5)}
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#f1f5f9',
                }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-gtm-border bg-gtm-surface p-5">
          <h2 className="mb-4 text-sm font-medium text-slate-200">Active hours</h2>
          <div className="overflow-x-auto">
            <div className="inline-block">
              <div className="flex">
                <div className="w-10" />
                {Array.from({ length: 24 }, (_, h) => h).map((h) => (
                  <div key={h} className="w-[14px] text-center text-[8px] text-gtm-muted">
                    {h % 6 === 0 ? h : ''}
                  </div>
                ))}
              </div>
              {DAYS.map((day, di) => (
                <div key={day} className="flex items-center">
                  <div className="w-10 text-[10px] text-gtm-muted">{day}</div>
                  {Array.from({ length: 24 }, (_, h) => h).map((h) => {
                    const count = cellCount(di, h);
                    const bg =
                      count === 0 ? '#1e293b' : `rgba(99,102,241,${0.25 + 0.75 * (count / maxCell)})`;
                    return (
                      <div
                        key={h}
                        title={`${count} commits · ${day} ${hourLabel(h)}`}
                        className="m-[1px] h-[12px] w-[12px] rounded-sm"
                        style={{ backgroundColor: bg }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
