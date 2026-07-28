'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Post = { id: string; body: string; created_at: string };
type Photo = { path: string; url: string };

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [totalVisits, setTotalVisits] = useState(0);

  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [postBody, setPostBody] = useState('');
  const [posting, setPosting] = useState(false);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');

  async function loadPhotos(supabase: ReturnType<typeof createClient>, uid: string) {
    const { data: files } = await supabase.storage
      .from('photos')
      .list(uid, { sortBy: { column: 'created_at', order: 'desc' } });
    const paths = (files ?? []).filter((f) => f.id).map((f) => `${uid}/${f.name}`);
    if (paths.length === 0) {
      setPhotos([]);
      return;
    }
    const { data: signed } = await supabase.storage.from('photos').createSignedUrls(paths, 3600);
    setPhotos((signed ?? []).filter((s) => s.signedUrl).map((s) => ({ path: s.path!, url: s.signedUrl! })));
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace('/login');
        return;
      }
      const uid = userData.user.id;

      const { data: profile } = await supabase.from('profiles').select('username').maybeSingle();
      setUsername(profile?.username ?? null);
      setDraft(profile?.username ?? '');

      const { count } = await supabase.from('check_ins').select('*', { count: 'exact', head: true });
      setTotalVisits(count ?? 0);

      const { data: postRows } = await supabase
        .from('posts')
        .select('id, body, created_at')
        .order('created_at', { ascending: false });
      setPosts(postRows ?? []);

      await loadPhotos(supabase, uid);

      setLoading(false);
    }
    load();
  }, [router]);

  async function saveUsername() {
    const clean = draft.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
      setError('3–20 characters: letters, numbers, or underscores.');
      return;
    }
    setSaving(true);
    setError('');
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from('profiles').update({ username: clean }).eq('id', userData.user!.id);
    if (error) {
      setError(error.code === '23505' ? 'That username is taken.' : error.message);
      setSaving(false);
      return;
    }
    setUsername(clean);
    setEditing(false);
    setSaving(false);
  }

  async function createPost() {
    const body = postBody.trim();
    if (!body) return;
    setPosting(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const { data: newPost, error } = await supabase
      .from('posts')
      .insert({ user_id: userData.user!.id, body })
      .select('id, body, created_at')
      .single();
    if (!error && newPost) {
      setPosts((prev) => [newPost, ...prev]);
      setPostBody('');
    }
    setPosting(false);
  }

  async function deletePost(id: string) {
    const supabase = createClient();
    await supabase.from('posts').delete().eq('id', id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError('Image must be under 10MB.');
      return;
    }
    setUploading(true);
    setPhotoError('');
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user!.id;
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${uid}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('photos').upload(path, file);
    if (error) {
      setPhotoError(error.message);
    } else {
      await loadPhotos(supabase, uid);
    }
    setUploading(false);
    e.target.value = '';
  }

  async function deletePhoto(path: string) {
    const supabase = createClient();
    await supabase.storage.from('photos').remove([path]);
    setPhotos((prev) => prev.filter((p) => p.path !== path));
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-neutral-400">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col gap-6 p-8">
      <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">← Dashboard</Link>

      <div className="flex flex-col items-center gap-2">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-700 text-2xl font-bold text-white">
          {username ? username[0].toUpperCase() : '?'}
        </div>
        {username && !editing ? (
          <div className="flex items-center gap-2">
            <p className="text-xl font-semibold text-neutral-900">@{username}</p>
            <button onClick={() => setEditing(true)} className="text-xs text-red-700 hover:underline">edit</button>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center gap-2">
            <p className="text-sm text-neutral-500">{username ? 'Change your username' : 'Pick a username to claim your page'}</p>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="username" className="w-56 rounded border border-neutral-300 px-3 py-2 text-center" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button onClick={saveUsername} disabled={saving} className="w-56 rounded bg-red-700 px-3 py-2 font-medium text-white hover:bg-red-800 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save username'}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 p-4 text-center">
        <p className="text-2xl font-bold text-red-700">{totalVisits}</p>
        <p className="text-xs text-neutral-500">total check-ins</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-700">Progress photos</p>
          <label className="cursor-pointer rounded-lg bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800">
            {uploading ? 'Uploading…' : '+ Add photo'}
            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
          </label>
        </div>
        {photoError && <p className="text-sm text-red-600">{photoError}</p>}
        {photos.length === 0 ? (
          <p className="text-center text-xs text-neutral-400">No photos yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <div key={p.path} className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="progress" className="h-full w-full object-cover" />
                <button onClick={() => deletePhoto(p.path)} className="absolute right-1 top-1 rounded bg-black/50 px-1.5 text-xs text-white">×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <textarea value={postBody} onChange={(e) => setPostBody(e.target.value)} placeholder="How did today's session go?" rows={3} maxLength={500} className="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        <button onClick={createPost} disabled={posting || !postBody.trim()} className="self-end rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50">
          {posting ? 'Posting…' : 'Post'}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {posts.length === 0 ? (
          <p className="text-center text-sm text-neutral-400">No posts yet. Log your first session above.</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="rounded-lg border border-neutral-200 p-3">
              <p className="whitespace-pre-wrap text-sm text-neutral-800">{post.body}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-neutral-400">{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                <button onClick={() => deletePost(post.id)} className="text-xs text-neutral-400 hover:text-red-600">delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}