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

    // Default to last 30 days if no dates provided
    const end = endDateStr ? new Date(endDateStr) : new Date();
    const start = startDateStr ? new Date(startDateStr) : subDays(end, 30);

    // Ensure valid dates
    const safeEnd = isNaN(end.getTime()) ? new Date() : end;
    const safeStart = isNaN(start.getTime()) ? subDays(safeEnd, 30) : start;

    // We'll fetch all leads in range and aggregate in JS for simplicity 
    // (Supabase doesn't have easy group-by via client without RPC usually, restricting pure SQL)
    const { data, error } = await supabase
        .from('Todos os clientes')
        .select('created_at, Status')
        .eq('ID_empresa', userId)
        .gte('created_at', safeStart.toISOString())
        .lte('created_at', safeEnd.toISOString())
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching chart data:", error);
        return [];
    }

    // Calculate number of days between start and end
    const diffTime = Math.abs(safeEnd.getTime() - safeStart.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // If range is huge, this might be slow loop, but usually it's fine for dashboard ranges.
    // If diffDays is 0 (same day), we want at least 1 entry? Or just that day.

    const dailyMap = new Map<string, { date: string, total: number, concluido: number, em_andamento: number, desqualificado: number }>();

    // Iterate day by day
    for (let i = 0; i <= diffDays; i++) {
        const d = subDays(safeEnd, diffDays - i);
        // If we want exact range matching, we might use addDays(safeStart, i)
        // Let's use addDays from safeStart to be more intuitive
    }

    // Re-implementation of loop using safeStart + i
    // We need to import addDays if not available, or use subDays negative? 
    // import { format, subDays, addDays, differenceInDays } from 'date-fns';
    // Let's just assume addDays is better. I need to update imports.
    // Actually, let's keep it consistent with previous logic if possible, or verify imports.
    // The previous file only had `format, subDays`. checking imports...

    // Let's rely on calculating backwards from EndDate like before if easier, 
    // or just use timestamps.
    const dayMilliseconds = 1000 * 60 * 60 * 24;

    for (let i = 0; i <= diffDays; i++) {
        // Logic: start + i days
        const d = new Date(safeStart.getTime() + (i * dayMilliseconds));
        // Safety: don't go past safeEnd (though diffDays calculation should prevent major overstep)
        if (d > safeEnd) break;

        const dateKey = format(d, 'yyyy-MM-dd');
        dailyMap.set(dateKey, {
            date: dateKey,
            total: 0,
            concluido: 0,
            em_andamento: 0,
            desqualificado: 0
        });
    }

    // Fill data
    data.forEach(lead => {
        // Adjust for timezone issues if simpler 'yyyy-MM-dd' is needed
        // lead.created_at is ISO. new Date(lead.created_at) might convert to local server time.
        // We should format purely based on the string or assume consistent UTC. 
        // For simplicity:
        const dateKey = format(new Date(lead.created_at), 'yyyy-MM-dd');
        const entry = dailyMap.get(dateKey);
        // Only count if it falls within the generated keys (it should, given query)
        if (entry) {
            entry.total += 1;
            if (lead.Status === 'Concluído') entry.concluido += 1;
            else if (lead.Status === 'Em andamento') entry.em_andamento += 1;
            else if (lead.Status === 'Desqualificado') entry.desqualificado += 1;
        }
    });

    return Array.from(dailyMap.values());
}
