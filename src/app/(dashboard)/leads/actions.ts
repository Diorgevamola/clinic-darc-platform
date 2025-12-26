'use server';

import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function getLeads(startDate?: string, endDate?: string, area?: string, limit: number = 100, status?: string) {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session || !session.value) {
        throw new Error("Usuário não autenticado");
    }

    const userId = session.value;
    const supabase = createClient();

    let query = supabase
        .from('leads')
        .select('id, nome, telefone, Status, created_at, status, area', { count: 'exact' })
        .eq('id_empresa', userId)
        .order('created_at', { ascending: false });

    if (startDate && endDate) {
        query = query.gte('created_at', startDate).lte('created_at', endDate);
    }

    if (area && area !== 'all') {
        query = query.eq('area', area);
    }

    if (status && status !== 'all') {
        query = query.eq('Status', status);
    }

    // Capture total count before applying limit
    const totalQuery = query;

    if (limit > 0) {
        query = query.limit(limit);
    }

    const { data, count, error } = await query;

    if (error) {
        console.error("Erro ao carregar leads:", error);
        return { data: [], count: 0 };
    }

    return { data, count: count || 0 };
}
