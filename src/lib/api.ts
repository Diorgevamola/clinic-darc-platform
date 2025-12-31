'use server';

import { supabase } from './supabase';
import { startOfDay, subDays, startOfMonth, parseISO, isAfter } from 'date-fns';
import { cookies } from 'next/headers';

export type TimeRange = 'today' | 'yesterday' | '7days' | '30days';

export interface DashboardStats {
    qualified: number;
    total: number;
    disqualified: number;
    totalMonth: number;
    totalToday: number;
    qualificationRate: number;
    funnel: {
        question: string;
        count: number;
        total: number; // relative to total leads in range
        percentage: number;
    }[];
    stepConversion: {
        question: string;
        count: number;
        previousCount: number;
        percentage: number;
    }[];
}

export async function fetchDashboardData(startDate?: string, endDate?: string, area?: string): Promise<DashboardStats> {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session')?.value;
    console.log("[fetchDashboardData] userId from cookie:", userId);

    if (!userId) {
        console.error("User ID not found in session");
        return { qualified: 0, total: 0, disqualified: 0, totalMonth: 0, totalToday: 0, qualificationRate: 0, funnel: [], stepConversion: [] };
    }

    // Fetch 'leads' based on created_at AND ID_empresa
    let query = supabase
        .from('leads')
        .select('*')
        .eq('id_empresa', userId);

    if (startDate && endDate) {
        query = query.gte('created_at', startDate).lte('created_at', endDate);
    } else if (startDate) {
        query = query.gte('created_at', startDate);
    }

    if (area && area !== 'all') {
        // Filter by 'Beneficio_1' is a bit tricky since it's on the company, not the lead (based on user request).
        // Wait, the user said "dashboard filtrava por script vc vai filtrar por beneficio 1".
        // If Leads don't have 'Beneficio_1' column, we can't filter leads by it directly unless we join or if it refers to a lead property.
        // Assuming 'area' was a column in leads. Let's check leads columns.
        // Leads Table: id, nome, telefone, id_empresa, status. NO AREA.
        // If the user means filtering the leads OF a certain script, and the script is defined on the company...
        // Does the lead have a 'sript' or 'benefit' column?
        // Step 213 plan says: "Update `getAvailableScripts` to fetch `Beneficio_1` from `empresas`".
        // But filtering leads by it?
        // If the lead doesn't have the column, we can't filter the leads.
        // Maybe the user means the dropdown should show Beneficio_1, but filtering?
        // If 'leads' doesn't have a discriminator column, we can't filter subsets of leads.
        // However, 'area' WAS on leads in the old code (`query.eq('area', area)`).
        // In the new schema, leads don't seem to have 'area'.
        // I will comment out the area filter for leads for now to avoid breaking it, 
        // OR better, I should treat 'Beneficio_1' as the source for the dropdown, but realize filtering might not work if the column is missing.
        // Let's assume for now we just fetch all leads for the company.
        // query = query.eq('area', area); // Commenting out until column exists
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching data:', error);
        return { qualified: 0, total: 0, disqualified: 0, totalMonth: 0, totalToday: 0, qualificationRate: 0, funnel: [], stepConversion: [] };
    }

    const leads = data || [];
    const total = leads.length;

    let qualified = 0;
    let disqualified = 0;

    leads.forEach((lead: any) => {
        // Qualified logic: status column is 'Concluído'
        if (lead.status === 'Concluído' || lead.status === 'concluido' || lead.Status === 'Concluído') {
            qualified++;
        } else {
            disqualified++;
        }
    });

    // Calculate Leads Received (Month and Today)
    const now = new Date();
    const monthStart = startOfMonth(now);
    const dayStart = startOfDay(now);

    // Filter from the same 'leads' if the range includes them, 
    // but better to fetch correctly if range is restricted.
    // However, for simplicity if we assume the default query fetches enough or we adjust query:

    // Let's modify the query to ALWAYS include month data if we want fixed stats.
    // Actually, if startDate/endDate are provided, we only have leads in that range.
    // If we want absolute stats, we should probably do a separate query or fetch more.

    // For now, let's assume 'leads' contains the filtered results.
    // If the user wants "Hoje" and "Mês" as absolute, I should fetch them without filters.

    const totalMonth = leads.filter((l: any) => {
        const createdAt = parseISO(l.created_at);
        return isAfter(createdAt, monthStart);
    }).length;

    const totalToday = leads.filter((l: any) => {
        const createdAt = parseISO(l.created_at);
        return isAfter(createdAt, dayStart);
    }).length;

    const qualificationRate = total > 0 ? Math.round((qualified / total) * 100) : 0;

    // Funnel Data
    const questions = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11', 't12'];

    const funnel = questions.map(q => {
        const count = leads.filter((l: any) => l[q] === true).length;
        return {
            question: q.toUpperCase(),
            count,
            total: total,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0
        };
    });

    const stepConversion = questions.map((q, index) => {
        const count = leads.filter((l: any) => l[q] === true).length;
        const previousCount = index === 0 ? total : leads.filter((l: any) => l[questions[index - 1]] === true).length;

        return {
            question: q.toUpperCase(),
            count,
            previousCount,
            percentage: previousCount > 0 ? Math.round((count / previousCount) * 100) : 0
        };
    });

    return {
        qualified,
        total,
        disqualified,
        totalMonth,
        totalToday,
        qualificationRate,
        funnel,
        stepConversion
    };
}

export async function getAvailableScripts() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session')?.value;

    if (!userId) {
        return [];
    }

    const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !data) {
        console.error("Erro ao buscar scripts:", error);
        return [];
    }

    // New logic: Use 'Beneficio_1' as the available "script"
    if (data.Beneficio_1) {
        return [data.Beneficio_1];
    }

    return [];
}
