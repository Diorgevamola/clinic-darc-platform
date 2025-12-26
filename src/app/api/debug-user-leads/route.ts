
import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createClient();
    const phone = '556599991024';

    // 1. Get User ID
    const { data: user, error: userError } = await supabase
        .from('empresa')
        .select('*')
        .eq('telefone', phone)
        .single();

    if (userError || !user) {
        return NextResponse.json({ error: 'User not found', details: userError });
    }

    // 2. Inspect leads columns using a sample query
    const { data: sampleLeads, error: queryError } = await supabase
        .from('leads')
        .select('*')
        .limit(1);

    const columns = sampleLeads && sampleLeads.length > 0 ? Object.keys(sampleLeads[0]) : [];

    // 3. Try to count with both cases if we find them
    const { count: countUpper } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('ID_empresa', user.id);

    const { count: countLower } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('id_empresa', user.id);

    return NextResponse.json({
        user: { id: user.id, phone },
        actualColumnsInLeadsTable: columns,
        countUsing_ID_empresa: countUpper,
        countUsing_id_empresa: countLower,
        queryError
    });
}
