
import { NextResponse } from 'next/server';

export async function GET() {
    console.log('--- DEBUG CREDENTIALS ---');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    // Log first 10 chars of key for verification
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    console.log('KEY (start):', key.substring(0, 15) + '...');
    console.log('--- END DEBUG ---');

    return NextResponse.json({ status: 'logged' });
}
