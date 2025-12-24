
'use server';

import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { UazapiChat, UazapiMessage, UazapiResponse } from "@/lib/uazapi";

async function getCredentials() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session?.value) {
        throw new Error("Usuário não autenticado");
    }

    const supabase = createClient();
    const { data, error } = await supabase
        .from('numero_dos_atendentes')
        .select('token_uazapi, url_uazapi')
        .eq('id', session.value)
        .single();

    if (error || !data) {
        console.error("Credentials error:", error || "Missing data");
        throw new Error(`Credenciais Uazapi não encontradas. Error: ${error?.message || 'Data missing'}`);
    }

    if (!data.token_uazapi || !data.url_uazapi) {
        throw new Error("Token ou URL da Uazapi não configurados para este usuário.");
    }

    return {
        token: data.token_uazapi,
        url: data.url_uazapi
    };
}

export async function fetchChats(page: number = 1, limit: number = 20): Promise<UazapiResponse<UazapiChat>> {
    try {
        const { token, url } = await getCredentials();
        const endpoint = `${url}/chat/find`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                limit: limit,
                offset: (page - 1) * limit,
                sort: "-wa_lastMsgTimestamp"
            }),
            next: { revalidate: 0 } // No cache for real-time feel
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error("fetchChats error:", error);
        return { response: [], count: 0, status: 500, error: error.message };
    }
}

export async function fetchMessages(chatId: string, limit: number = 50): Promise<UazapiResponse<UazapiMessage>> {
    try {
        const { token, url } = await getCredentials();
        const endpoint = `${url}/message/find`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chatid: chatId,
                limit: limit,
                sort: "-wa_timestamp" // Usually we want newest first, but UI might invert. Let's get newest.
            }),
            next: { revalidate: 0 }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error("fetchMessages error:", error);
        return { response: [], count: 0, status: 500, error: error.message };
    }
}
