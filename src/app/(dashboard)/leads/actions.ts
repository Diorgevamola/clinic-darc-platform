'use server';

import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function getLeads(startDate?: string, endDate?: string, area?: string, limit: number = 100, status?: string) {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session')?.value;
    console.log("[getLeads] userId from cookie:", userId);

    if (!userId) {
        return { data: [], count: 0 };
    }

    const supabase = createClient();

    let query = supabase
        .from('leads')
        .select('*')
        .eq('id_empresa', userId)
        .order('created_at', { ascending: false });

    if (startDate && endDate) {
        query = query.gte('created_at', startDate).lte('created_at', endDate);
    } else if (startDate) {
        query = query.gte('created_at', startDate);
    }

    if (area && area !== 'all') {
        // query = query.eq('area', area); // Column 'area' does not exist on leads
    }

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    if (limit > 0) {
        query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Erro ao carregar leads:", error);
        return { data: [], count: 0 };
    }

    return {
        data: data || [],
        count: (data || []).length
    };
}
