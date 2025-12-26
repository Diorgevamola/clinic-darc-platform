'use server';

import { createClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { format, subDays } from 'date-fns';

export async function getLeadsOverTimeData(startDateStr?: string, endDateStr?: string) {
    const supabase = createClient();
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session?.value) {
        return [];
    }

    const userId = session.value;

    // Use America/Sao_Paulo timezone offset (-3h) for grouping
    const BR_OFFSET = -3 * 60 * 60 * 1000;

    // Default to last 7 days if no dates provided to show context
    const end = endDateStr ? new Date(endDateStr) : new Date();
    const start = startDateStr ? new Date(startDateStr) : subDays(end, 7);

    const safeEnd = isNaN(end.getTime()) ? new Date() : end;
    const safeStart = isNaN(start.getTime()) ? subDays(safeEnd, 7) : start;

    const { data, error } = await supabase
        .from('leads')
        .select('created_at, Status')
        .eq('ID_empresa', userId)
        .gte('created_at', safeStart.toISOString())
        .lte('created_at', safeEnd.toISOString())
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching chart data:", error);
        return [];
    }

    const dailyMap = new Map<string, { date: string, total: number, concluido: number, em_andamento: number, desqualificado: number }>();

    // Generate keys for all days in range (inclusive)
    const dayMs = 1000 * 60 * 60 * 24;
    const startTimeBR = safeStart.getTime() + BR_OFFSET;
    const endTimeBR = safeEnd.getTime() + BR_OFFSET;

    // Normalize to start of day in BR
    const startDateBR = new Date(startTimeBR);
    startDateBR.setUTCHours(0, 0, 0, 0);

    const endDateBR = new Date(endTimeBR);
    endDateBR.setUTCHours(0, 0, 0, 0);

    let current = new Date(startDateBR);
    while (current <= endDateBR) {
        const dateKey = format(current, 'yyyy-MM-dd');
        dailyMap.set(dateKey, {
            date: dateKey,
            total: 0,
            concluido: 0,
            em_andamento: 0,
            desqualificado: 0
        });
        current = new Date(current.getTime() + dayMs);
    }

    // Fill data grouping by BR date
    data.forEach(lead => {
        const leadDateBR = new Date(new Date(lead.created_at).getTime() + BR_OFFSET);
        const dateKey = format(leadDateBR, 'yyyy-MM-dd');
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
