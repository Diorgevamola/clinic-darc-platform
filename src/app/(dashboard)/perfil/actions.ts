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
        .from('empresa')
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
        "endereco": formData.get("endereco"),
        "token_wpp": formData.get("token_wpp"),
        "telefone": formData.get("telefone"),
        "url_uazapi": formData.get("url_uazapi"),
    };

    const { error } = await supabase
        .from('empresa')
        .update(updates)
        .eq('id', userId);

    if (error) {
        console.error("Erro ao atualizar perfil:", error);
        return { error: "Falha ao atualizar perfil" };
    }

    return { success: true };
}

export async function getInstanceStatus() {
    try {
        const profile = await getUserProfile();

        if (!profile.token_wpp || !profile.url_uazapi) {
            return { state: 'disconnected', error: "Configurações incompletas" };
        }

        // Endpoint usually is /instance/connectionState/{instanceName}
        // But for Uazapi often it's just /instance/connectionState with token authentication
        // or /instance/status based on the user request.
        // User pointed to: https://docs.uazapi.com/endpoint/get/instance~status
        // Let's try /instance/connectionState based on common patterns, assuming instance name is inferred from token or predefined.
        // If Uazapi uses instance name in URL, we might need it. 
        const endpoint = `${profile.url_uazapi}/instance/status`;

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'token': profile.token_wpp,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            next: { revalidate: 0 }
        });

        if (!response.ok) {
            console.error(`Uazapi status error: ${response.status}`);
            return { state: 'error', error: `Erro API: ${response.status}` };
        }

        const data = await response.json();
        // Handle different Uazapi/Evolution response formats
        // Format 1: { instance: { state: 'open' } }
        // Format 2: { status: { connected: true } }
        let state = 'unknown';

        if (data?.instance?.state) {
            state = data.instance.state;
        } else if (data?.status?.connected === true) {
            state = 'open';
        } else if (data?.status?.connected === false) {
            state = 'close';
        } else if (data?.state) {
            state = data.state;
        }

        return { state, raw: data };

    } catch (error: any) {
        console.error("getInstanceStatus exception:", error);
        return { state: 'error', error: error.message };
    }
}
