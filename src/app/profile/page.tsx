import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProfileClient from './ProfileClient';

type Post = {
  id: string;
  body: string | null;
  image_path: string | null;
  created_at: string;
  imageUrl: string | null;
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect('/login');
  const uid = userData.user.id;

  const { data: profile } = await supabase.from('profiles').select('username').eq('id', uid).maybeSingle();

  const { count } = await supabase.from('check_ins').select('*', { count: 'exact', head: true }).eq('user_id', uid);

  const { data: postRows } = await supabase
    .from('posts')
    .select('id, body, image_path, created_at')
    .eq('user_id', uid)
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
  const posts: Post[] = rows.map((r) => ({
    ...r,
    imageUrl: r.image_path ? urlByPath.get(r.image_path) ?? null : null,
  }));

  return (
    <ProfileClient
      userId={uid}
      initialUsername={profile?.username ?? null}
      totalVisits={count ?? 0}
      posts={posts}
    />
  );
}