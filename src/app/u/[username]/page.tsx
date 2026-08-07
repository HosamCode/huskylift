'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Post = {
    id: string;
    body: string | null;
    image_path: string | null;
    created_at: string;
    imageUrl: string | null;
};

export default function UserProfilePage() {
    const params = useParams();
    const username = String(params.username);

    const [loading, setLoading] = useState(true);
    const [found, setFound] = useState(false);
    const [totalVisits, setTotalVisits] = useState(0);
    const [posts, setPosts] = useState<Post[]>([]);

    useEffect(() => {
        async function load() {
            const supabase = createClient();

            const { data: profile } = await supabase
                .from('profiles')
                .select('id, username')
                .eq('username', username)
                .maybeSingle();

            if (!profile) {
                setLoading(false);
                return;
            }
            setFound(true);

            const { count } = await supabase
                .from('check_ins')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id);
            setTotalVisits(count ?? 0);

            const { data: postRows } = await supabase
                .from('posts')
                .select('id, body, image_path, created_at')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false });

            const rows = postRows ?? [];
            const paths = rows.filter((r) => r.image_path).map((r) => r.image_path as string);
            const urlByPath = new Map<string, string>();
            if (paths.length > 0) {
                const { data: signed } = await supabase.storage.from('photos').createSignedUrls(paths, 3600);
                (signed ?? []).forEach((s) => {
                    if (s.signedUrl && s.path) urlByPath.set(s.path, s.signedUrl);
                });
            }
            setPosts(rows.map((r) => ({ ...r, imageUrl: r.image_path ? urlByPath.get(r.image_path) ?? null : null })));

            setLoading(false);
        }
        load();
    }, [username]);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center p-8">
                <p className="text-neutral-400">Loading...</p>
            </main>
        );
    }

    if (!found) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
                <p className="text-neutral-600">No user found with that username.</p>
                <Link href="/friends" className="text-sm font-medium text-red-700 hover:underline">Back to friends</Link>
            </main>
        );
    }

    return (
        <main className="mx-auto flex min-h-screen max-w-sm flex-col gap-6 p-8">
            <Link href="/friends" className="text-sm text-neutral-500 hover:underline">Friends</Link>

            <div className="flex flex-col items-center gap-2">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-700 text-2xl font-bold text-white">
                    {username[0]?.toUpperCase()}
                </div>
                <p className="text-xl font-semibold text-neutral-900">@{username}</p>
            </div>

            <div className="rounded-xl border border-neutral-200 p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{totalVisits}</p>
                <p className="text-xs text-neutral-500">total check-ins</p>
            </div>

            <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-neutral-700">Posts</p>
                {posts.length === 0 ? (
                    <p className="text-center text-sm text-neutral-400">Nothing to show. (If you&apos;re not friends, their activity stays private.)</p>
                ) : (
                    posts.map((post) => (
                        <div key={post.id} className="rounded-lg border border-neutral-200 p-3">
                            {post.imageUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={post.imageUrl} alt="post" className="mb-2 w-full rounded-lg object-cover" />
                            )}
                            {post.body && <p className="whitespace-pre-wrap text-sm text-neutral-800">{post.body}</p>}
                            <span className="mt-2 block text-xs text-neutral-400">
                                {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}