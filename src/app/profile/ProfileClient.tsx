'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { createClient } from '@/lib/supabase/client';

type Post = {
    id: string;
    body: string | null;
    image_path: string | null;
    created_at: string;
    imageUrl: string | null;
};

export default function ProfileClient({
    userId,
    initialUsername,
    totalVisits,
    posts,
}: {
    userId: string;
    initialUsername: string | null;
    totalVisits: number;
    posts: Post[];
}) {
    const router = useRouter();

    const [username, setUsername] = useState<string | null>(initialUsername);
    const [draft, setDraft] = useState(initialUsername ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(false);

    const [postBody, setPostBody] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [posting, setPosting] = useState(false);

    async function saveUsername() {
        const clean = draft.trim().toLowerCase();
        if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
            setError('3–20 characters: letters, numbers, or underscores.');
            return;
        }
        setSaving(true);
        setError('');
        const supabase = createClient();
        const { error } = await supabase.from('profiles').update({ username: clean }).eq('id', userId);
        if (error) {
            setError(error.code === '23505' ? 'That username is taken.' : error.message);
            setSaving(false);
            return;
        }
        setUsername(clean);
        setEditing(false);
        setSaving(false);
        router.refresh();
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

        let imagePath: string | null = null;
        if (photoFile) {
            const ext = (photoFile.name.split('.').pop() || 'jpg').toLowerCase();
            imagePath = `${userId}/${crypto.randomUUID()}.${ext}`;
            const { error: upErr } = await supabase.storage.from('photos').upload(imagePath, photoFile);
            if (upErr) {
                setError(upErr.message);
                setPosting(false);
                return;
            }
        }

        const { error } = await supabase.from('posts').insert({ user_id: userId, body: text || null, image_path: imagePath });
        if (error) {
            setError(error.message);
            setPosting(false);
            return;
        }

        setPostBody('');
        clearPhoto();
        setPosting(false);
        router.refresh();
    }

    async function deletePost(post: Post) {
        const supabase = createClient();
        await supabase.from('posts').delete().eq('id', post.id);
        if (post.image_path) await supabase.storage.from('photos').remove([post.image_path]);
        router.refresh();
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
                        <p className="text-xl font-semibold">@{username}</p>
                        <button onClick={() => setEditing(true)} className="text-xs text-red-700 hover:underline">edit</button>
                    </div>
                ) : (
                    <div className="flex w-full flex-col items-center gap-2">
                        <p className="text-sm text-stone-500">{username ? 'Change your username' : 'Pick a username to claim your page'}</p>
                        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="username" className="w-56 rounded border border-stone-300 bg-white px-3 py-2 text-center" />
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <button onClick={saveUsername} disabled={saving} className="w-56 rounded bg-red-600 px-3 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-60">
                            {saving ? 'Saving…' : 'Save username'}
                        </button>
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{totalVisits}</p>
                <p className="text-xs text-stone-500">total check-ins</p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-3">
                <textarea value={postBody} onChange={(e) => setPostBody(e.target.value)} placeholder="Share an update, or add a photo…" rows={3} maxLength={500} className="w-full resize-none rounded-lg border border-stone-300 px-3 py-2 text-sm" />

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
                    <button onClick={createPost} disabled={posting || (!postBody.trim() && !photoFile)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                        {posting ? 'Posting…' : 'Post'}
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {posts.length === 0 ? (
                    <p className="text-center text-sm text-stone-400">No posts yet. Share your first update above.</p>
                ) : (
                    posts.map((post) => (
                        <div key={post.id} className="rounded-lg border border-stone-200 bg-white p-3">
                            {post.imageUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={post.imageUrl} alt="post" className="mb-2 w-full rounded-lg object-cover" />
                            )}
                            {post.body && <p className="whitespace-pre-wrap text-sm text-stone-800">{post.body}</p>}
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-stone-400">{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                <button onClick={() => deletePost(post)} className="text-xs text-stone-400 hover:text-red-600">delete</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}