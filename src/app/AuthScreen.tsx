'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function Dumbbell({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <rect x="8" y="10.5" width="8" height="3" rx="1.5" />
            <rect x="5.5" y="8" width="2.5" height="8" rx="1.25" />
            <rect x="3" y="9.5" width="1.8" height="5" rx="0.9" />
            <rect x="16" y="8" width="2.5" height="8" rx="1.25" />
            <rect x="19.2" y="9.5" width="1.8" height="5" rx="0.9" />
        </svg>
    );
}

export default function AuthScreen({ initialMode }: { initialMode: 'login' | 'signup' }) {
    const router = useRouter();
    const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isSignup = mode === 'signup';

    async function handleSubmit() {
        setError('');
        if (isSignup && !email.trim().toLowerCase().endsWith('@northeastern.edu')) {
            setError('Please use your @northeastern.edu email.');
            return;
        }
        setLoading(true);
        const supabase = createClient();
        const { error } = isSignup
            ? await supabase.auth.signUp({ email, password })
            : await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }
        router.push('/dashboard');
        router.refresh();
    }

    function toggle() {
        setMode(isSignup ? 'login' : 'signup');
        setError('');
    }

    return (
        <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#f4f1ea] px-6 py-10 text-stone-800">
            {/* Faint tiled dumbbell background */}
            <div className="pointer-events-none absolute inset-0 flex flex-wrap content-start gap-6 overflow-hidden p-6 opacity-[0.05]" aria-hidden="true">
                {Array.from({ length: 80 }).map((_, i) => (
                    <Dumbbell key={i} className="h-14 w-14 -rotate-12 text-stone-600" />
                ))}
            </div>

            {/* Brand */}
            <div className="relative z-10 mb-6 flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 text-white shadow-[0_0_50px_-12px_rgba(220,38,38,0.8)]">
                    <Dumbbell className="h-9 w-9" />
                </div>
                <span className="font-[family-name:var(--font-poppins)] text-2xl font-extrabold tracking-tight">
                    Husky<span className="text-red-600">Lift</span>
                </span>
            </div>

            {/* Card */}
            <div className="relative z-10 w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-7 shadow-xl">
                <h1 className="font-[family-name:var(--font-poppins)] text-2xl font-bold tracking-tight">
                    {isSignup ? 'Create your account' : 'Welcome back'}
                </h1>
                <p className="mt-1 text-sm text-stone-500">
                    {isSignup ? 'Sign up with your Northeastern email.' : 'Log in to keep your streak going.'}
                </p>

                <div className="mt-6 flex flex-col gap-3">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder="you@northeastern.edu"
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder={isSignup ? 'Create a password (6+ characters)' : 'Password'}
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="font-[family-name:var(--font-poppins)] mt-1 w-full rounded-full bg-red-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95 disabled:opacity-60"
                    >
                        {loading ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
                    </button>
                </div>

                <div className="mt-5 text-center text-sm text-stone-500">
                    {isSignup ? 'Already have an account? ' : 'New to HuskyLift? '}
                    <button onClick={toggle} className="font-semibold text-red-600 hover:underline">
                        {isSignup ? 'Log in' : 'Sign up'}
                    </button>
                </div>
            </div>

            <p className="relative z-10 mt-6 text-xs text-stone-400">For the Marino Recreation Center community.</p>
        </main>
    );
}