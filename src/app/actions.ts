
'use server';

import { cookies } from 'next/headers';

import { createClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';

const supabase = createClient();

export async function loginAction(prevState: any, formData: FormData) {
    const phone = formData.get('phone') as string;
    console.log('Login attempt with phone:', phone);

    if (!phone) {
        return { error: 'Telefone é obrigatório' };
    }

    let userData: any = null;

    // Verify phone against database
    try {
        // DEBUG: Log the Supabase URL to confirm which instance is being used
        const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'UNDEFINED';
        console.log('--- DEBUG CONNECTION ---');
        console.log('Connecting to Supabase URL:', sbUrl);
        console.log('Querying phone:', phone);

        const { data, error } = await supabase
            .from('empresa')
            .select('id, nome')
            .eq('telefone', phone)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return { error: 'Erro ao verificar telefone' };
        }

        if (!data) {
            console.log('Phone not found');
            return { error: 'Telefone não encontrado' };
        }

        userData = data;
        console.log('Phone found, creating session for ID:', userData.id);
    } catch (e: any) {
        console.error('Unexpected error in loginAction query:', e);
        return { error: 'Ocorreu um erro inesperado na verificação' };
    }

    // Set session cookie with user ID as string
    try {
        const cookieStore = await cookies();
        cookieStore.set('session', userData.id.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });
        console.log('Session set. Redirecting...');
    } catch (e: any) {
        console.error('Error setting cookie:', e);
        return { error: 'Erro ao criar sessão' };
    }

    redirect('/');
}

export async function logoutAction() {
    (await cookies()).delete('session');
    redirect('/login');
}
