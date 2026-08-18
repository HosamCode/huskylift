'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import NavBar from '@/components/NavBar';

function pad(n: number) {
    return String(n).padStart(2, '0');
}

function dateKey(year: number, month: number, day: number) {
    return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function formatElapsed(ms: number) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
    return `${m}:${pad(sec)}`;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export default function DashboardClient({
    name,
    userId,
    goal,
    visitedDates,
    today,
    streak,
    thisWeek,
    openSession,
}: {
    name: string;
    userId: string;
    goal: number;
    visitedDates: string[];
    today: string;
    streak: number;
    thisWeek: number;
    openSession: { id: string; startMs: number } | null;
}) {
    const router = useRouter();
    const visited = new Set(visitedDates);

    const [yStr, mStr] = today.split('-');
    const todayYear = Number(yStr);
    const todayMonth = Number(mStr) - 1;

    const [viewYear, setViewYear] = useState(todayYear);
    const [viewMonth, setViewMonth] = useState(todayMonth);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [nowMs, setNowMs] = useState(Date.now());

    const isCheckedIn = openSession !== null;
    const isCurrentMonth = viewYear === todayYear && viewMonth === todayMonth;

    useEffect(() => {
        if (!openSession) return;
        const t = setInterval(() => setNowMs(Date.now()), 1000);
        return () => clearInterval(t);
    }, [openSession]);

    function prevMonth() {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else setViewMonth(viewMonth - 1);
    }

    function nextMonth() {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else setViewMonth(viewMonth + 1);
    }

    async function handleCheckIn() {
        setSaving(true);
        setError('');
        const supabase = createClient();
        await supabase.from('check_ins').update({ checked_out_at: new Date().toISOString() }).eq('user_id', userId).is('checked_out_at', null);
        const { error } = await supabase.from('check_ins').insert({ user_id: userId });
        if (error) {
            setError(error.message);
            setSaving(false);
            return;
        }
        setSaving(false);
        router.refresh();
    }

    async function handleCheckOut() {
        if (!openSession) return;
        setSaving(true);
        setError('');
        const supabase = createClient();
        const { error } = await supabase.from('check_ins').update({ checked_out_at: new Date().toISOString() }).eq('id', openSession.id);
        if (error) {
            setError(error.message);
            setSaving(false);
            return;
        }
        setSaving(false);
        router.refresh();
    }

    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const monthPrefix = `${viewYear}-${pad(viewMonth + 1)}`;
    let monthCount = 0;
    for (const d of visited) if (d.startsWith(monthPrefix)) monthCount++;

    const elapsed = openSession ? nowMs - openSession.startMs : 0;
    const startLabel = openSession
        ? new Date(openSession.startMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : '';

    return (
        <main className="flex min-h-screen flex-col items-center gap-6 p-8">
            <NavBar />
            <h1 className="text-3xl font-bold text-red-700">Welcome, {name}!</h1>

            <div className="flex w-full max-w-sm items-center justify-around rounded-xl border border-stone-200 bg-white p-4">
                <div className="text-center">
                    <p className="text-2xl font-bold text-red-700">{streak}</p>
                    <p className="text-xs text-stone-500">week streak</p>
                </div>
                <div className="h-10 w-px bg-stone-200" />
                <div className="text-center">
                    <div className="flex justify-center gap-1 text-lg leading-none">
                        {Array.from({ length: goal }).map((_, i) => (
                            <span key={i} className={i < Math.min(thisWeek, goal) ? 'text-red-700' : 'text-stone-300'}>●</span>
                        ))}
                    </div>
                    <p className="mt-1 text-xs text-stone-500">{thisWeek} / {goal} this week</p>
                </div>
            </div>

            {isCheckedIn ? (
                <div className="flex flex-col items-center gap-5">
                    <div className="relative flex h-48 w-48 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/25 motion-reduce:hidden" />
                        <span className="absolute inset-0 rounded-full ring-2 ring-emerald-400/40" />
                        <div className="relative flex h-48 w-48 flex-col items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_70px_-15px_rgba(16,185,129,0.85)]">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-50/90">At Marino</span>
                            <span className="mt-1 text-4xl font-bold tabular-nums tracking-tight">{formatElapsed(elapsed)}</span>
                            <span className="mt-1.5 text-xs text-emerald-50/70">since {startLabel}</span>
                        </div>
                    </div>
                    <button onClick={handleCheckOut} disabled={saving} className="rounded-full bg-stone-800 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-900 active:scale-95 disabled:opacity-60">
                        {saving ? '…' : 'Check Out'}
                    </button>
                    <p className="text-sm text-stone-500">Tap when you head out.</p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-5">
                    <button onClick={handleCheckIn} disabled={saving} className="flex h-48 w-48 items-center justify-center rounded-full bg-red-600 text-2xl font-bold tracking-tight text-white shadow-[0_0_70px_-15px_rgba(220,38,38,0.6)] transition duration-200 hover:scale-105 hover:bg-red-700 active:scale-95 disabled:opacity-60">
                        {saving ? 'Saving…' : 'Check In'}
                    </button>
                    <p className="text-sm text-stone-500">Tap when you arrive at Marino.</p>
                </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                    <button onClick={prevMonth} aria-label="Previous month" className="rounded px-2 py-1 text-stone-500 hover:bg-stone-100">‹</button>
                    <p className="font-semibold text-stone-800">{MONTHS[viewMonth]} {viewYear}</p>
                    <button onClick={nextMonth} disabled={isCurrentMonth} aria-label="Next month" className="rounded px-2 py-1 text-stone-500 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30">›</button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs text-stone-400">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                        <div key={d} className="py-1">{d}</div>
                    ))}
                </div>

                <div className="mt-1 grid grid-cols-7 gap-1">
                    {cells.map((day, i) => {
                        if (day === null) return <div key={i} />;
                        const key = dateKey(viewYear, viewMonth, day);
                        const isVisited = visited.has(key);
                        const isToday = key === today;
                        return (
                            <div
                                key={i}
                                className={[
                                    'flex aspect-square items-center justify-center rounded-full text-sm',
                                    isVisited ? 'bg-red-700 font-semibold text-white' : 'text-stone-700',
                                    isToday && !isVisited ? 'ring-2 ring-red-300' : '',
                                ].join(' ')}
                            >
                                {day}
                            </div>
                        );
                    })}
                </div>

                <p className="mt-3 text-center text-xs text-stone-400">
                    {monthCount} {monthCount === 1 ? 'visit' : 'visits'} in {MONTHS[viewMonth]}
                </p>
            </div>

            <p className="text-xs text-stone-400">
                {visited.size} total {visited.size === 1 ? 'visit' : 'visits'}
            </p>
        </main>
    );
}