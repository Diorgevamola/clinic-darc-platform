'use server';

import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function getUserProfile() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session || !session.value) {
        throw new Error("Usuário não autenticado");
    }

    const userId = session.value;
    const supabase = createClient();

    const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error("Erro ao buscar perfil:", error);
        throw new Error("Falha ao carregar dados do perfil");
    }

    return data;
}

export async function updateUserProfile(formData: FormData) {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session || !session.value) {
        return { error: "Usuário não autenticado" };
    }

    const userId = session.value;
    const supabase = createClient();

    const updates = {
        "nome": formData.get("nome"),
        "link_planilha": formData.get("link_planilha"),
    };

    const { error } = await supabase
        .from('empresas')
        .update(updates)
        .eq('id', userId);

    if (error) {
        console.error("Erro ao atualizar perfil:", error);
        return { error: "Falha ao atualizar perfil" };
    }

    return { success: true };
}

