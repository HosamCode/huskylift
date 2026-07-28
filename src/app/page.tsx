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
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-white px-6 py-16 text-center">
      <div className="flex flex-col items-center gap-5">
        <Image src="/icon-192.png" alt="HuskyLift" width={80} height={80} className="rounded-2xl shadow-sm" priority />
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-neutral-900">
            Husky<span className="text-red-700">Lift</span>
          </h1>
          <p className="mt-3 text-lg text-neutral-500">Show up. Track every visit. Build the streak.</p>
        </div>
      </div>

      <p className="max-w-md text-balance text-neutral-600">
        The simplest way for Northeastern students to stay consistent at Marino. One tap when you arrive — watch your streak grow.
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link href="/login" className="rounded-lg bg-red-700 px-6 py-3 font-semibold text-white transition hover:bg-red-800">
          Log in
        </Link>
        <Link href="/signup" className="rounded-lg border border-neutral-300 px-6 py-3 font-semibold text-neutral-800 transition hover:bg-neutral-50">
          Sign up
        </Link>
      </div>

      <p className="text-xs text-neutral-400">Built for the Marino Recreation Center community.</p>
    </main>
  );
}
