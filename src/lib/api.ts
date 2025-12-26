'use server';

import { supabase } from './supabase';
import { startOfDay, subDays, startOfMonth, parseISO, isAfter } from 'date-fns';
import { cookies } from 'next/headers';

export type TimeRange = 'today' | 'yesterday' | '7days' | '30days';

export interface DashboardStats {
    qualified: number;
    total: number;
    disqualified: number;
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

    if (!userId) {
        console.error("User ID not found in session");
        return { qualified: 0, total: 0, disqualified: 0, funnel: [], stepConversion: [] };
    }

    // Fetch 'leads' based on created_at AND ID_empresa
    let query = supabase
        .from('leads')
        .select('*')
        .eq('ID_empresa', userId);

    if (startDate && endDate) {
        query = query.gte('created_at', startDate).lte('created_at', endDate);
    } else if (startDate) {
        query = query.gte('created_at', startDate);
    }

    if (area && area !== 'all') {
        query = query.eq('area', area);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching data:', error);
        return { qualified: 0, total: 0, disqualified: 0, funnel: [], stepConversion: [] };
    }

    const leads = data || [];
    const total = leads.length;

    let qualified = 0;
    let disqualified = 0;

    leads.forEach((lead: any) => {
        // Qualified logic: Status column is 'Concluído'
        // Note: 'Status' (capital S) as per CSV structure
        if (lead.Status === 'Concluído') {
            qualified++;
        } else {
            disqualified++;
        }
    });

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
        .from('empresa')
        .select('area_1, area_2, area_3, area_4, area_5, area_6')
        .eq('id', userId)
        .single();

    if (error) {
        console.error("Erro ao buscar scripts:", error);
        return [];
    }

    const areas = [
        data.area_1,
        data.area_2,
        data.area_3,
        data.area_4,
        data.area_5,
        data.area_6
    ].filter(a => a && a.trim() !== '');

    return Array.from(new Set(areas));
}
