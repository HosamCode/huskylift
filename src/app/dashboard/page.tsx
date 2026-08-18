import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';

function pad(n: number) {
  return String(n).padStart(2, '0');
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

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect('/login');
  const uid = userData.user.id;

  const today = todayInBoston();

  const { data: profileRows } = await supabase.from('profiles').select('weekly_goal').eq('id', uid).limit(1);
  const goal = (profileRows?.[0]?.weekly_goal as number) ?? 3;

  const { data: rows } = await supabase
    .from('check_ins')
    .select('id, checked_in_at, checked_out_at, visit_date')
    .eq('user_id', uid);

  const list = rows ?? [];
  const visitedDates = Array.from(new Set(list.map((r) => r.visit_date as string)));
  const visited = new Set(visitedDates);

  const streak = computeStreak(visited, goal, today);
  const currentWeekStart = mondayOf(today);
  let thisWeek = 0;
  for (const d of visited) if (mondayOf(d) === currentWeekStart) thisWeek++;

  const openRow = list.find((r) => r.visit_date === today && r.checked_out_at === null);
  const openSession = openRow
    ? { id: openRow.id as string, startMs: new Date(openRow.checked_in_at as string).getTime() }
    : null;

  const email = userData.user.email ?? '';
  const name = email.split('@')[0] || 'there';

  return (
    <DashboardClient
      name={name}
      userId={uid}
      goal={goal}
      visitedDates={visitedDates}
      today={today}
      streak={streak}
      thisWeek={thisWeek}
      openSession={openSession}
    />
  );
}