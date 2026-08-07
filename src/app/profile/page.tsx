'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { createClient } from '@/lib/supabase/client';


type Post = {
  id: string;
  body: string | null;
  image_path: string | null;
  created_at: string;
  imageUrl: string | null;
};

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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace('/login');
        return;
      }
      const uid = userData.user.id;

      const { data: profile } = await supabase.from('profiles').select('username').eq('id', uid).maybeSingle();
      setUsername(profile?.username ?? null);
      setDraft(profile?.username ?? '');

      const { count } = await supabase.from('check_ins').select('*', { count: 'exact', head: true }).eq('user_id', uid);
      setTotalVisits(count ?? 0);

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
      setPosts(rows.map((r) => ({ ...r, imageUrl: r.image_path ? urlByPath.get(r.image_path) ?? null : null })));

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

  function handleSelectPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB.');
      return;
    }
    setError('');
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    e.target.value = '';
  }

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
  }

  async function createPost() {
    const text = postBody.trim();
    if (!text && !photoFile) return;

    setPosting(true);
    setError('');
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user!.id;

    let imagePath: string | null = null;
    if (photoFile) {
      const ext = (photoFile.name.split('.').pop() || 'jpg').toLowerCase();
      imagePath = `${uid}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('photos').upload(imagePath, photoFile);
      if (upErr) {
        setError(upErr.message);
        setPosting(false);
        return;
      }
    }

    const { data: newPost, error } = await supabase
      .from('posts')
      .insert({ user_id: uid, body: text || null, image_path: imagePath })
      .select('id, body, image_path, created_at')
      .single();

    if (error || !newPost) {
      setError(error?.message ?? 'Could not post.');
      setPosting(false);
      return;
    }

    let imageUrl: string | null = null;
    if (newPost.image_path) {
      const { data: signed } = await supabase.storage.from('photos').createSignedUrl(newPost.image_path, 3600);
      imageUrl = signed?.signedUrl ?? null;
    }

    setPosts((prev) => [{ ...newPost, imageUrl }, ...prev]);
    setPostBody('');
    clearPhoto();
    setPosting(false);
  }

  async function deletePost(post: Post) {
    const supabase = createClient();
    await supabase.from('posts').delete().eq('id', post.id);
    if (post.image_path) await supabase.storage.from('photos').remove([post.image_path]);
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
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
      <NavBar />
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

      <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-3">
        <textarea value={postBody} onChange={(e) => setPostBody(e.target.value)} placeholder="Share an update, or add a photo…" rows={3} maxLength={500} className="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm" />

        {photoPreview && (
          <div className="relative w-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoPreview} alt="preview" className="aspect-square w-24 rounded-lg object-cover" />
            <button onClick={clearPhoto} className="absolute right-1 top-1 rounded bg-black/50 px-1.5 text-xs text-white">×</button>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between">
          <label className="cursor-pointer text-sm font-medium text-red-700 hover:underline">
            + Photo
            <input type="file" accept="image/*" onChange={handleSelectPhoto} className="hidden" />
          </label>
          <button onClick={createPost} disabled={posting || (!postBody.trim() && !photoFile)} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50">
            {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {posts.length === 0 ? (
          <p className="text-center text-sm text-neutral-400">No posts yet. Share your first update above.</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="rounded-lg border border-neutral-200 p-3">
              {post.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.imageUrl} alt="post" className="mb-2 w-full rounded-lg object-cover" />
              )}
              {post.body && <p className="whitespace-pre-wrap text-sm text-neutral-800">{post.body}</p>}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-neutral-400">{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                <button onClick={() => deletePost(post)} className="text-xs text-neutral-400 hover:text-red-600">delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}