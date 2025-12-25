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
        .from('Todos os clientes')
        .select(`
            id, 
            nome, 
            telefone, 
            Status, 
            created_at,
            "resumo da conversa",
            t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11, t12,
            follow_up_1_enviado,
            follow_up_2_enviado,
            IA_responde
        `)
        .eq('ID_empresa', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erro ao carregar leads para Kanban:", error);
        return [];
    }

    return data;
}

export async function updateLeadStatus(leadId: string | number, newStatus: string) {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session || !session.value) {
        throw new Error("Usuário não autenticado");
    }

    const supabase = createClient();

    const { error } = await supabase
        .from('Todos os clientes')
        .update({ Status: newStatus })
        .eq('id', leadId);

    if (error) {
        console.error("Erro ao atualizar status do lead:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}
