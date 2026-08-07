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

function todayInBoston() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

function mondayOf(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const offset = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - offset);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

function computeStreak(visited: Set<string>, goal: number, todayStr: string) {
  const perWeek = new Map<string, number>();
  for (const d of visited) {
    const wk = mondayOf(d);
    perWeek.set(wk, (perWeek.get(wk) ?? 0) + 1);
  }
  const [y, m, d] = mondayOf(todayStr).split('-').map(Number);
  const cursor = new Date(y, m - 1, d);
  const keyOf = () => `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`;
  let streak = 0;
  if ((perWeek.get(keyOf()) ?? 0) >= goal) streak = 1;
  cursor.setDate(cursor.getDate() - 7);
  while ((perWeek.get(keyOf()) ?? 0) >= goal) {
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

// Turn milliseconds into a friendly "1h 05m" / "23m 40s".
function formatElapsed(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${pad(m)}m`;
  return `${m}m ${pad(sec)}s`;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function DashboardPage() {
  const router = useRouter();

  const today = todayInBoston();
  const [yStr, mStr] = today.split('-');
  const todayYear = Number(yStr);
  const todayMonth = Number(mStr) - 1;

  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [goal, setGoal] = useState(3);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [viewYear, setViewYear] = useState(todayYear);
  const [viewMonth, setViewMonth] = useState(todayMonth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Session state: an open session (no check-out yet) started today.
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());

  const isCheckedIn = openSessionId !== null;
  const isCurrentMonth = viewYear === todayYear && viewMonth === todayMonth;

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace('/login');
        return;
      }
      const uid = data.user.id;
      setUserId(uid);
      const email = data.user.email ?? '';
      setName(email.split('@')[0] || 'there');

      const { data: profileRows } = await supabase.from('profiles').select('weekly_goal').eq('id', uid).limit(1);
      setGoal((profileRows?.[0]?.weekly_goal as number) ?? 3);

      const { data: rows } = await supabase
        .from('check_ins')
        .select('id, checked_in_at, checked_out_at, visit_date')
        .eq('user_id', uid);

      const list = rows ?? [];
      setVisited(new Set(list.map((r) => r.visit_date as string)));

      const openToday = list.find((r) => r.visit_date === today && r.checked_out_at === null);
      if (openToday) {
        setOpenSessionId(openToday.id as string);
        setSessionStart(new Date(openToday.checked_in_at as string).getTime());
      }

      setLoading(false);
    }
    load();
  }, [router, today]);

  // Live timer: tick once a second while a session is open.
  useEffect(() => {
    if (openSessionId === null) return;
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [openSessionId]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  async function handleCheckIn() {
    setSaving(true);
    setError('');
    const supabase = createClient();

    // Auto-close any forgotten open sessions before starting a new one.
    await supabase.from('check_ins').update({ checked_out_at: new Date().toISOString() }).eq('user_id', userId).is('checked_out_at', null);

    const { data: newRow, error } = await supabase
      .from('check_ins')
      .insert({ user_id: userId })
      .select('id, checked_in_at')
      .single();

    if (error || !newRow) {
      setError(error?.message ?? 'Could not check in.');
      setSaving(false);
      return;
    }

    setOpenSessionId(newRow.id as string);
    setSessionStart(new Date(newRow.checked_in_at as string).getTime());
    setNowMs(Date.now());
    setVisited((prev) => new Set(prev).add(today));
    setSaving(false);
  }

  async function handleCheckOut() {
    if (!openSessionId) return;
    setSaving(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.from('check_ins').update({ checked_out_at: new Date().toISOString() }).eq('id', openSessionId);
    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    setOpenSessionId(null);
    setSessionStart(null);
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-neutral-400">Loading…</p>
      </main>
    );
  }

  const streak = computeStreak(visited, goal, today);
  const currentWeekStart = mondayOf(today);
  let thisWeek = 0;
  for (const d of visited) if (mondayOf(d) === currentWeekStart) thisWeek++;
  const monthPrefix = `${viewYear}-${pad(viewMonth + 1)}`;
  let monthCount = 0;
  for (const d of visited) if (d.startsWith(monthPrefix)) monthCount++;

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const elapsed = sessionStart ? nowMs - sessionStart : 0;

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 p-8">
      <NavBar />
      <h1 className="text-3xl font-bold text-red-700">Welcome, {name}!</h1>

      <div className="flex w-full max-w-sm items-center justify-around rounded-xl border border-neutral-200 p-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-red-700">{streak}</p>
          <p className="text-xs text-neutral-500">week streak</p>
        </div>
        <div className="h-10 w-px bg-neutral-200" />
        <div className="text-center">
          <div className="flex justify-center gap-1 text-lg leading-none">
            {Array.from({ length: goal }).map((_, i) => (
              <span key={i} className={i < Math.min(thisWeek, goal) ? 'text-red-700' : 'text-neutral-300'}>●</span>
            ))}
          </div>
          <p className="mt-1 text-xs text-neutral-500">{thisWeek} / {goal} this week</p>
        </div>
      </div>

      {isCheckedIn ? (
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full bg-green-600 text-white">
            <span className="text-sm font-medium">Checked in</span>
            <span className="text-2xl font-bold tabular-nums">{formatElapsed(elapsed)}</span>
          </div>
          <button
            onClick={handleCheckOut}
            disabled={saving}
            className="rounded-lg bg-neutral-800 px-6 py-2 text-sm font-medium text-white hover:bg-neutral-900 disabled:opacity-60"
          >
            {saving ? '…' : 'Check Out'}
          </button>
        </div>
      ) : (
        <button
          onClick={handleCheckIn}
          disabled={saving}
          className="flex h-40 w-40 items-center justify-center rounded-full bg-red-700 text-xl font-bold text-white hover:bg-red-800 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Check In'}
        </button>
      )}

      <p className="text-sm text-neutral-500">
        {isCheckedIn ? "You're at Marino now — tap Check Out when you leave." : 'Tap when you arrive at Marino.'}
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="w-full max-w-sm rounded-xl border border-neutral-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={prevMonth} aria-label="Previous month" className="rounded px-2 py-1 text-neutral-500 hover:bg-neutral-100">‹</button>
          <p className="font-semibold text-neutral-800">{MONTHS[viewMonth]} {viewYear}</p>
          <button onClick={nextMonth} disabled={isCurrentMonth} aria-label="Next month" className="rounded px-2 py-1 text-neutral-500 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30">›</button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-400">
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
                  isVisited ? 'bg-red-700 font-semibold text-white' : 'text-neutral-700',
                  isToday && !isVisited ? 'ring-2 ring-red-300' : '',
                ].join(' ')}
              >
                {day}
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-center text-xs text-neutral-400">
          {monthCount} {monthCount === 1 ? 'visit' : 'visits'} in {MONTHS[viewMonth]}
        </p>
      </div>

      <p className="text-xs text-neutral-400">
        {visited.size} total {visited.size === 1 ? 'visit' : 'visits'}
      </p>
    </main>
  );
}