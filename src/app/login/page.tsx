'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold text-red-700">Log in to HuskyLift</h1>

      <input
        className="w-64 rounded border border-neutral-300 px-3 py-2"
        type="email"
        placeholder="you@northeastern.edu"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="w-64 rounded border border-neutral-300 px-3 py-2"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="w-64 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleLogin}
        className="w-64 rounded bg-red-700 px-3 py-2 font-medium text-white"
      >
        Log in
      </button>
    </main>
  );
}
