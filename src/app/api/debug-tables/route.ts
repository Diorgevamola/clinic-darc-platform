
import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createClient();
    const tablesToCheck = [
        'empresa',
        'leads',
        'TeuCliente',
        'numero_dos_atendentes',
        'Todos os clientes'
    ];

    const results = {};

    for (const table of tablesToCheck) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error && error.code === 'PGRST205') {
            results[table] = 'MISSING (Not found in schema cache)';
        } else if (error) {
            results[table] = `ERROR: ${error.message} (${error.code})`;
        } else {
            results[table] = 'EXISTS';
        }
    }

    return NextResponse.json(results);
}
