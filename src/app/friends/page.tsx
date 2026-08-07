'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type Profile = { id: string; username: string | null };
type Friend = { friendshipId: string; id: string; username: string | null };

export default function FriendsPage() {
    const router = useRouter();
    const [myId, setMyId] = useState('');
    const [loading, setLoading] = useState(true);

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Profile[]>([]);
    const [searching, setSearching] = useState(false);

    const [friends, setFriends] = useState<Friend[]>([]);
    const [incoming, setIncoming] = useState<Friend[]>([]);
    const [outgoingIds, setOutgoingIds] = useState<Set<string>>(new Set());

    const loadFriends = useCallback(async (uid: string) => {
        const supabase = createClient();
        const { data: rows } = await supabase
            .from('friendships')
            .select('id, requester_id, addressee_id, status')
            .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`);

        const list = rows ?? [];
        const otherIds = Array.from(
            new Set(list.map((r) => (r.requester_id === uid ? r.addressee_id : r.requester_id))),
        );

        const nameById = new Map<string, string | null>();
        if (otherIds.length > 0) {
            const { data: profs } = await supabase.from('profiles').select('id, username').in('id', otherIds);
            (profs ?? []).forEach((p) => nameById.set(p.id, p.username));
        }

        const accepted: Friend[] = [];
        const incomingReq: Friend[] = [];
        const outgoing = new Set<string>();

        for (const r of list) {
            const otherId = r.requester_id === uid ? r.addressee_id : r.requester_id;
            if (r.status === 'accepted') {
                accepted.push({ friendshipId: r.id, id: otherId, username: nameById.get(otherId) ?? null });
            } else if (r.addressee_id === uid) {
                incomingReq.push({ friendshipId: r.id, id: otherId, username: nameById.get(otherId) ?? null });
            } else {
                outgoing.add(otherId);
            }
        }

        setFriends(accepted);
        setIncoming(incomingReq);
        setOutgoingIds(outgoing);
    }, []);

    useEffect(() => {
        async function init() {
            const supabase = createClient();
            const { data } = await supabase.auth.getUser();
            if (!data.user) {
                router.replace('/login');
                return;
            }
            setMyId(data.user.id);
            await loadFriends(data.user.id);
            setLoading(false);
        }
        init();
    }, [router, loadFriends]);

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
        await loadFriends(myId);
    }

    async function acceptRequest(friendshipId: string) {
        const supabase = createClient();
        await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
        await loadFriends(myId);
    }

    async function removeFriendship(friendshipId: string) {
        const supabase = createClient();
        await supabase.from('friendships').delete().eq('id', friendshipId);
        await loadFriends(myId);
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center p-8">
                <p className="text-neutral-400">Loading…</p>
            </main>
        );
    }

    const friendIds = new Set(friends.map((f) => f.id));
    const incomingIds = new Set(incoming.map((f) => f.id));

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
                        className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm"
                    />
                    <button onClick={runSearch} className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800">
                        {searching ? '…' : 'Search'}
                    </button>
                </div>

                {results.map((p) => {
                    const isFriend = friendIds.has(p.id);
                    const isIncoming = incomingIds.has(p.id);
                    const isOutgoing = outgoingIds.has(p.id);
                    return (
                        <div key={p.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2">
                            <Link href={`/u/${p.username}`} className="text-sm font-medium hover:underline">@{p.username}</Link>
                            {isFriend ? (
                                <span className="text-xs text-neutral-400">Friends</span>
                            ) : isOutgoing ? (
                                <span className="text-xs text-neutral-400">Requested</span>
                            ) : isIncoming ? (
                                <span className="text-xs text-neutral-400">Wants to add you</span>
                            ) : (
                                <button onClick={() => sendRequest(p.id)} className="rounded bg-red-700 px-3 py-1 text-xs font-medium text-white hover:bg-red-800">
                                    Add
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {incoming.length > 0 && (
                <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold text-neutral-700">Requests</p>
                    {incoming.map((f) => (
                        <div key={f.friendshipId} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2">
                            <Link href={`/u/${f.username}`} className="text-sm font-medium hover:underline">@{f.username}</Link>
                            <div className="flex gap-2">
                                <button onClick={() => acceptRequest(f.friendshipId)} className="rounded bg-red-700 px-3 py-1 text-xs font-medium text-white hover:bg-red-800">
                                    Accept
                                </button>
                                <button onClick={() => removeFriendship(f.friendshipId)} className="rounded border border-neutral-300 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-100">
                                    Decline
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-neutral-700">Your friends ({friends.length})</p>
                {friends.length === 0 ? (
                    <p className="text-center text-sm text-neutral-400">No friends yet. Search above to add someone.</p>
                ) : (
                    friends.map((f) => (
                        <div key={f.friendshipId} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2">
                            <Link href={`/u/${f.username}`} className="text-sm font-medium hover:underline">@{f.username}</Link>
                            <button onClick={() => removeFriendship(f.friendshipId)} className="text-xs text-neutral-400 hover:text-red-600">
                                remove
                            </button>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}