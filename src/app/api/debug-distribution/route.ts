
import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createClient();

    // Check if table exists and is accessible
    const { data, error } = await supabase
        .from('atendente')
        .select('*')
        .limit(5);

    return NextResponse.json({
        table: 'atendente',
        data,
        error,
        details: error ? JSON.stringify(error, null, 2) : 'No error'
    });
}
