import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AuthScreen from '@/app/AuthScreen';

export default async function SignUpPage() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect('/dashboard');
    return <AuthScreen initialMode="signup" />;
}