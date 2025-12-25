'use server';

import { createClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { format, subDays } from 'date-fns';

export async function getLeadsOverTimeData() {
    const supabase = createClient();
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session?.value) {
        return [];
    }

    const userId = session.value;
    const endDate = new Date();
    const startDate = subDays(endDate, 30); // Last 30 days

    // We'll fetch all leads in range and aggregate in JS for simplicity 
    // (Supabase doesn't have easy group-by via client without RPC usually, restricting pure SQL)
    const { data, error } = await supabase
        .from('Todos os clientes')
        .select('created_at, Status')
        .eq('ID_empresa', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching chart data:", error);
        return [];
    }

    // Initialize map for last 30 days
    const dailyMap = new Map<string, { date: string, total: number, concluido: number, em_andamento: number, desqualificado: number }>();

    for (let i = 0; i <= 30; i++) {
        const d = subDays(endDate, 30 - i);
        const dateKey = format(d, 'yyyy-MM-dd');
        dailyMap.set(dateKey, {
            date: dateKey,
            total: 0,
            concluido: 0,
            em_andamento: 0,
            desqualificado: 0
        });
    }

    data.forEach(lead => {
        const dateKey = format(new Date(lead.created_at), 'yyyy-MM-dd');
        const entry = dailyMap.get(dateKey);
        if (entry) {
            entry.total += 1;
            if (lead.Status === 'Concluído') entry.concluido += 1;
            else if (lead.Status === 'Em andamento') entry.em_andamento += 1;
            else if (lead.Status === 'Desqualificado') entry.desqualificado += 1;
        }
    });

    return Array.from(dailyMap.values());
}
