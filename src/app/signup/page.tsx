'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignUpPage() {
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    async function handleSignUp() {
        if (!email.endsWith('@northeastern.edu')) {
            setError('Please use your @northeastern.edu email.');
            return;
        }
        setError('');

        const { error } = await supabase.auth.signUp({ email, password });

        if (error) {
            setError(error.message);
        } else {
            setSuccess(true);
        }
    }

    if (success) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
                <h1 className="text-3xl font-bold text-red-700">You're in!</h1>
                <p className="text-neutral-600">Your account is ready.</p>
                <Link href="/login" className="font-medium text-red-700 hover:underline">
                    Go to log in
                </Link>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
            <h1 className="text-3xl font-bold text-red-700">Sign up for HuskyLift</h1>

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
                placeholder="Password (6+ characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="w-64 text-sm text-red-600">{error}</p>}

            <button
                onClick={handleSignUp}
                className="w-64 rounded bg-red-700 px-3 py-2 font-medium text-white hover:bg-red-800"
            >
                Sign up
            </button>

            <p className="text-sm text-neutral-500">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-red-700 hover:underline">
                    Log in
                </Link>
            </p>
        </main>
    );
}
