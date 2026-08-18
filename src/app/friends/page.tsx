import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FriendsClient from './FriendsClient';

type Friend = { friendshipId: string; id: string; username: string | null };

export default async function FriendsPage() {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) redirect('/login');
    const uid = userData.user.id;

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

    const friends: Friend[] = [];
    const incoming: Friend[] = [];
    const outgoingIds: string[] = [];

    for (const r of list) {
        const otherId = r.requester_id === uid ? r.addressee_id : r.requester_id;
        const username = nameById.get(otherId) ?? null;
        if (r.status === 'accepted') friends.push({ friendshipId: r.id, id: otherId, username });
        else if (r.addressee_id === uid) incoming.push({ friendshipId: r.id, id: otherId, username });
        else outgoingIds.push(otherId);
    }

    return <FriendsClient myId={uid} friends={friends} incoming={incoming} outgoingIds={outgoingIds} />;
}