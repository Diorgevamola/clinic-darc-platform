'use server';

import { createClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export interface TeuCliente {
    id: number;
    created_at?: string;
    Nome: string;
    Telefone: string;
    id_numero?: number;
    "Leads hoje"?: number;
    "Leads total"?: number;
    link_planilha?: string;
}

export async function getDistributionList() {
    const supabase = createClient();
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session?.value) {
        return { success: false, error: "Unauthorized" };
    }

    const userId = parseInt(session.value);

    // Filter by id_numero matching the logged-in user's ID
    const { data, error } = await supabase
        .from('TeuCliente')
        .select('*')
        .eq('id_numero', userId)
        .order('Nome', { ascending: true });

    if (error) {
        console.error("Error fetching distribution list:", error);
        return { success: false, error: error.message };
    }

    return { success: true, data: data as TeuCliente[] };
}

export async function saveDistributionNumber(data: Partial<TeuCliente>) {
    const supabase = createClient();
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session?.value) {
        return { success: false, error: "Unauthorized" };
    }

    const userId = parseInt(session.value);

    if (!data.Nome || !data.Telefone) {
        return { success: false, error: "Nome e Telefone são obrigatórios" };
    }

    // Ensure we only insert/update current user's data
    const payload = {
        Nome: data.Nome,
        Telefone: data.Telefone.replace(/\D/g, ''), // Sanitize phone
        id_numero: userId, // Force link to current user
        link_planilha: data.link_planilha || '',
        // Default values if new (only used on insert generally, or if passed)
        "Limit. p/ dia": 10,
        "Leads hoje": data["Leads hoje"] ?? 0,
        "Leads total": data["Leads total"] ?? 0,
        atingiu_limite: false
    };

    let result;

    if (data.id) {
        // Update
        result = await supabase
            .from('TeuCliente')
            .update(payload)
            .eq('id', data.id)
            .eq('id_numero', userId); // Security check
    } else {
        // Insert
        result = await supabase
            .from('TeuCliente')
            .insert([payload]);
    }

    if (result.error) {
        console.error("Error saving distribution number:", result.error);
        return { success: false, error: result.error.message };
    }

    revalidatePath('/distribuicao');
    return { success: true };
}

export async function deleteDistributionNumber(id: number) {
    const supabase = createClient();
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session?.value) {
        return { success: false, error: "Unauthorized" };
    }

    const userId = parseInt(session.value);

    const { error } = await supabase
        .from('TeuCliente')
        .delete()
        .eq('id', id)
        .eq('id_numero', userId); // Security check

    if (error) {
        console.error("Error deleting distribution number:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/distribuicao');
    return { success: true };
}
