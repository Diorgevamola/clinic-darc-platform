'use server';

import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function getKanbanLeads() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session || !session.value) {
        throw new Error("Usuário não autenticado");
    }

    const userId = session.value;
    const supabase = createClient();

    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('ID_empresa', userId);

    if (error) {
        console.error("Error fetching leads for kanban:", error);
        return [];
    }

    return data;
}

export async function updateLeadStatus(id: number, status: string) {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session?.value) return { success: false, error: "Unauthorized" };

    const supabase = createClient();

    const { error } = await supabase
        .from('leads')
        .update({ Status: status })
        .eq('id', id)
        .eq('ID_empresa', session.value);

    if (error) {
        console.error("Erro ao atualizar status do lead:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}
