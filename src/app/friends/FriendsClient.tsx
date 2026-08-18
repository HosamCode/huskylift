'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { createClient } from '@/lib/supabase/client';

type Friend = { friendshipId: string; id: string; username: string | null };
type Profile = { id: string; username: string | null };

export default function FriendsClient({
    myId,
    friends,
    incoming,
    outgoingIds,
}: {
    myId: string;
    friends: Friend[];
    incoming: Friend[];
    outgoingIds: string[];
}) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Profile[]>([]);
    const [searching, setSearching] = useState(false);

    const friendIds = new Set(friends.map((f) => f.id));
    const incomingIds = new Set(incoming.map((f) => f.id));
    const outgoing = new Set(outgoingIds);

    async function runSearch() {
        const q = query.trim().toLowerCase();
        if (!q) {
            setResults([]);
            return;
        }
        setSearching(true);
        const supabase = createClient();
        const { data } = await supabase
            .from('profiles')
            .select('id, username')
            .ilike('username', `%${q}%`)
            .neq('id', myId)
            .limit(10);
        setResults(data ?? []);
        setSearching(false);
    }

    async function sendRequest(otherId: string) {
        const supabase = createClient();
        await supabase.from('friendships').insert({ requester_id: myId, addressee_id: otherId });
        router.refresh();
    }

    async function acceptRequest(friendshipId: string) {
        const supabase = createClient();
        await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
        router.refresh();
    }

    async function removeFriendship(friendshipId: string) {
        const supabase = createClient();
        await supabase.from('friendships').delete().eq('id', friendshipId);
        router.refresh();
    }

    return (
        <main className="mx-auto flex min-h-screen max-w-sm flex-col gap-6 p-8">
            <NavBar />
            <h1 className="text-2xl font-bold text-red-700">Friends</h1>

            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                        placeholder="Search by username"
                        className="flex-1 rounded border border-stone-300 bg-white px-3 py-2 text-sm"
                    />
                    <button onClick={runSearch} className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                        {searching ? '…' : 'Search'}
                    </button>
                </div>

                {results.map((p) => {
                    const isFriend = friendIds.has(p.id);
                    const isIncoming = incomingIds.has(p.id);
                    const isOutgoing = outgoing.has(p.id);
                    return (
                        <div key={p.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2">
                            <Link href={`/u/${p.username}`} className="text-sm font-medium hover:underline">@{p.username}</Link>
                            {isFriend ? (
                                <span className="text-xs text-stone-400">Friends</span>
                            ) : isOutgoing ? (
                                <span className="text-xs text-stone-400">Requested</span>
                            ) : isIncoming ? (
                                <span className="text-xs text-stone-400">Wants to add you</span>
                            ) : (
                                <button onClick={() => sendRequest(p.id)} className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700">
                                    Add
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {incoming.length > 0 && (
                <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold text-stone-700">Requests</p>
                    {incoming.map((f) => (
                        <div key={f.friendshipId} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2">
                            <Link href={`/u/${f.username}`} className="text-sm font-medium hover:underline">@{f.username}</Link>
                            <div className="flex gap-2">
                                <button onClick={() => acceptRequest(f.friendshipId)} className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700">
                                    Accept
                                </button>
                                <button onClick={() => removeFriendship(f.friendshipId)} className="rounded border border-stone-300 px-3 py-1 text-xs text-stone-600 hover:bg-stone-100">
                                    Decline
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-stone-700">Your friends ({friends.length})</p>
                {friends.length === 0 ? (
                    <p className="text-center text-sm text-stone-400">No friends yet. Search above to add someone.</p>
                ) : (
                    friends.map((f) => (
                        <div key={f.friendshipId} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2">
                            <Link href={`/u/${f.username}`} className="text-sm font-medium hover:underline">@{f.username}</Link>
                            <button onClick={() => removeFriendship(f.friendshipId)} className="text-xs text-stone-400 hover:text-red-600">
                                remove
                            </button>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}