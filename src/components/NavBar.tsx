'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const links = [
    { href: '/dashboard', label: 'Home' },
    { href: '/friends', label: 'Friends' },
    { href: '/profile', label: 'Profile' },
];

export default function NavBar() {
    const pathname = usePathname();
    const router = useRouter();

    async function handleLogout() {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.replace('/login');
    }

    return (
        <nav className="mb-4 flex w-full max-w-sm items-center justify-between border-b border-neutral-200 pb-3">
            <div className="flex gap-4">
                {links.map((l) => (
                    <Link
                        key={l.href}
                        href={l.href}
                        className={
                            pathname === l.href
                                ? 'text-sm font-semibold text-red-700'
                                : 'text-sm font-medium text-neutral-500 hover:text-neutral-800'
                        }
                    >
                        {l.label}
                    </Link>
                ))}
            </div>
            <button onClick={handleLogout} className="text-sm font-medium text-neutral-400 hover:text-red-600">
                Log out
            </button>
        </nav>
    );
}