import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#f4f1ea] text-stone-800">
      <header className="flex items-center justify-between px-6 py-5">
        <span className="font-[family-name:var(--font-poppins)] text-xl font-extrabold tracking-tight">
          Husky<span className="text-red-600">Lift</span>
        </span>
        <Link
          href="/login"
          className="font-[family-name:var(--font-poppins)] text-sm font-semibold text-stone-600 transition hover:text-stone-900"
        >
          Log in
        </Link>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <Image
          src="/icon-192.png"
          alt="HuskyLift"
          width={72}
          height={72}
          className="mb-8 rounded-2xl shadow-sm"
          priority
        />

        <h1 className="font-[family-name:var(--font-poppins)] text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Build your <span className="text-red-600">Marino</span> habit
        </h1>

        <p className="mt-5 max-w-md text-lg text-stone-500">
          One-tap check-ins, streaks, and your gym history — all in one place.
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

        <p className="mt-8 text-xs text-stone-400">For the Marino Recreation Center community.</p>
      </div>
    </main>
  );
}
