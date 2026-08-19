import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect('/dashboard');

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-stone-800">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-stone-200/60 bg-[#f4f1ea]/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-[family-name:var(--font-poppins)] text-xl font-extrabold tracking-tight">
            Husky<span className="text-red-600">Lift</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-stone-600 transition hover:text-stone-900">
              Log in
            </Link>
            <Link
              href="/signup"
              className="font-[family-name:var(--font-poppins)] rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pt-16 pb-8 text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white/60 px-3 py-1 text-xs font-semibold text-stone-600">
          <Image src="/icon-192.png" alt="" width={16} height={16} className="rounded" />
          Built for Northeastern students
        </span>

        <h1 className="font-[family-name:var(--font-poppins)] text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Build your <span className="text-red-600">Marino</span> habit
        </h1>

        <p className="mt-6 max-w-xl text-lg text-stone-500">
          One tap when you arrive. HuskyLift logs your gym visits, keeps your streak alive, and shows your consistency at a glance — the simplest way to actually keep showing up.
        </p>

        <div className="mt-9 flex w-full max-w-xs flex-col gap-3">
          <Link
            href="/signup"
            className="font-[family-name:var(--font-poppins)] rounded-full bg-red-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="font-[family-name:var(--font-poppins)] rounded-full border border-stone-300 bg-white/60 px-6 py-3.5 font-semibold text-stone-700 transition hover:bg-white active:scale-95"
          >
            I already have an account
          </Link>
        </div>

        {/* Phone mockup */}
        <div className="mt-16 w-full max-w-[300px]">
          <div className="overflow-hidden rounded-[2.5rem] border-[10px] border-stone-900 bg-white shadow-2xl">
            <div className="flex flex-col items-center gap-4 px-5 py-7">
              <div className="flex w-full justify-between text-[10px] font-medium text-stone-400">
                <span className="font-semibold text-red-600">Home</span>
                <span>Friends</span>
                <span>Profile</span>
              </div>
              <div className="flex w-full items-center justify-around rounded-lg border border-stone-200 py-2">
                <div className="text-center">
                  <p className="text-lg font-bold text-red-700">5</p>
                  <p className="text-[9px] text-stone-500">week streak</p>
                </div>
                <div className="h-6 w-px bg-stone-200" />
                <div className="text-center">
                  <div className="flex justify-center gap-0.5 text-[10px] leading-none">
                    <span className="text-red-600">●</span>
                    <span className="text-red-600">●</span>
                    <span className="text-stone-300">●</span>
                  </div>
                  <p className="mt-1 text-[9px] text-stone-500">2 / 3 this week</p>
                </div>
              </div>
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white shadow-[0_0_30px_-8px_rgba(220,38,38,0.7)]">
                Check In
              </div>
              <p className="text-[10px] text-stone-400">Tap when you arrive at Marino.</p>
              <div className="grid w-full grid-cols-7 gap-1 pt-1">
                {Array.from({ length: 21 }).map((_, i) => {
                  const filled = [1, 3, 4, 8, 10, 11, 15, 17, 18].includes(i);
                  return <div key={i} className={`aspect-square rounded-full ${filled ? 'bg-red-600' : 'bg-stone-100'}`} />;
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-stone-200/60 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="font-[family-name:var(--font-poppins)] text-center text-3xl font-bold tracking-tight">
            Everything you need to stay consistent
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 p-6 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" /></svg>
              </div>
              <h3 className="font-[family-name:var(--font-poppins)] text-lg font-semibold">One-tap check-in</h3>
              <p className="mt-2 text-sm text-stone-500">Arrive, tap once, done. Your visit is logged in seconds — no forms, no fuss.</p>
            </div>
            <div className="rounded-2xl border border-stone-200 p-6 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8" /><path d="M17 7h4v4" /></svg>
              </div>
              <h3 className="font-[family-name:var(--font-poppins)] text-lg font-semibold">Streaks that respect rest days</h3>
              <p className="mt-2 text-sm text-stone-500">Hit a weekly goal, not an impossible daily chain. Consistency that matches how training actually works.</p>
            </div>
            <div className="rounded-2xl border border-stone-200 p-6 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" /></svg>
              </div>
              <h3 className="font-[family-name:var(--font-poppins)] text-lg font-semibold">Your history, visualized</h3>
              <p className="mt-2 text-sm text-stone-500">A clean calendar of every visit, plus your total check-ins and current streak.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="font-[family-name:var(--font-poppins)] text-center text-3xl font-bold tracking-tight">
          Get going in under a minute
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {[
            { n: '1', t: 'Sign up', d: 'Create an account with your @northeastern.edu email.' },
            { n: '2', t: 'Check in', d: 'Tap the button when you arrive at Marino.' },
            { n: '3', t: 'Keep the streak', d: 'Watch your consistency build, week after week.' },
          ].map((s) => (
            <div key={s.n} className="flex flex-col items-center text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 font-[family-name:var(--font-poppins)] text-lg font-bold text-white">
                {s.n}
              </div>
              <h3 className="mt-4 font-[family-name:var(--font-poppins)] text-lg font-semibold">{s.t}</h3>
              <p className="mt-2 max-w-xs text-sm text-stone-500">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social */}
      <section className="border-y border-stone-200/60 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="font-[family-name:var(--font-poppins)] text-3xl font-bold tracking-tight">
            Better with friends
          </h2>
          <p className="mt-4 text-stone-500">
            Add the people you actually lift with, see each other&apos;s streaks, and keep one another accountable. Everything stays <span className="font-semibold text-stone-700">private by default</span> — your progress is visible only to friends you approve. No public feed, no pressure to perform.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-red-600">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="font-[family-name:var(--font-poppins)] text-4xl font-extrabold tracking-tight text-white">
            Ready to build the habit?
          </h2>
          <p className="mt-4 text-red-100">It&apos;s free for every Husky.</p>
          <Link
            href="/signup"
            className="font-[family-name:var(--font-poppins)] mt-8 inline-block rounded-full bg-white px-8 py-3.5 font-semibold text-red-600 shadow-sm transition hover:bg-red-50 active:scale-95"
          >
            Get started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-5xl px-6 py-10 text-center">
        <span className="font-[family-name:var(--font-poppins)] text-lg font-extrabold tracking-tight">
          Husky<span className="text-red-600">Lift</span>
        </span>
        <p className="mt-3 text-xs text-stone-400">
          Built for the Marino Recreation Center community. An independent student project, not affiliated with Northeastern University.
        </p>
      </footer>
    </main>
  );
}