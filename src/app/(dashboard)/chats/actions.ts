
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

    const userId = parseInt(session.value); // Added this line
    const supabase = createClient();
    const { data, error } = await supabase
        .from('empresa')
        .select('url_uazapi, token_wpp')
        .eq('id', userId)
        .single();

    if (error || !data) {
        console.error("Credentials error:", error || "Missing data");
        throw new Error(`Credenciais Uazapi não encontradas. Error: ${error?.message || 'Data missing'}`);
    }

    if (!data.token_wpp || !data.url_uazapi) {
        throw new Error("Token ou URL da Uazapi não configurados para este usuário.");
    }

    return {
        token: data.token_wpp,
        url: data.url_uazapi
    };
}


function normalizeMessageType(type: string): string {
    if (!type) return 'text';
    const lower = type.toLowerCase();
    if (lower.includes('audio')) return 'audio';
    if (lower.includes('image')) return 'image';
    if (lower.includes('video')) return 'video';
    if (lower.includes('document')) return 'document';
    if (lower.includes('sticker')) return 'sticker';
    if (lower.includes('location')) return 'location';
    if (lower.includes('contact')) return 'contact';
    return lower.replace('message', '');
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

        const data: UazapiResponse<UazapiChat> = await response.json();

        const chats = data.chats || data.response || [];

        // Enrich with AI status from Supabase
        try {
            chats.forEach(chat => { chat.isAIEnabled = false; });

            const cookieStore = await cookies();
            const session = cookieStore.get('session');
            if (session?.value && chats.length > 0) {
                const userId = parseInt(session.value);
                const supabase = createClient();
                const phones = chats.map(c => (c.phone || c.wa_chatid.split('@')[0]).replace(/\D/g, ''));

                const { data: leadStatuses } = await supabase
                    .from('leads')
                    .select('telefone, IA_responde, Status, t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11, t12')
                    .eq('id_empresa', userId)
                    .in('telefone', phones);

                if (leadStatuses) {
                    const statusMap = new Map(leadStatuses.map((l: any) => [l.telefone, l]));
                    chats.forEach(chat => {
                        const p = (chat.phone || chat.wa_chatid.split('@')[0]).replace(/\D/g, '');
                        const leadData = statusMap.get(p);
                        if (leadData) {
                            chat.isAIEnabled = leadData.IA_responde === true || leadData.IA_responde === 'true';
                            chat.isCompleted = leadData.Status === 'Concluído';
                            chat.status = leadData.Status;
                            chat.t1 = leadData.t1; chat.t2 = leadData.t2; chat.t3 = leadData.t3; chat.t4 = leadData.t4;
                            chat.t5 = leadData.t5; chat.t6 = leadData.t6; chat.t7 = leadData.t7; chat.t8 = leadData.t8;
                            chat.t9 = leadData.t9; chat.t10 = leadData.t10; chat.t11 = leadData.t11; chat.t12 = leadData.t12;
                        }
                    });
                }
            }
        } catch (supabaseError) {
            console.error("Error enriching chats with Supabase status:", supabaseError);
        }

        chats.forEach(chat => {
            if (chat.wa_lastMessageType) {
                chat.wa_lastMessageType = normalizeMessageType(chat.wa_lastMessageType);
            }
        });

        return data;
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
                sort: "-messageTimestamp" // Correct field from Uazapi docs
            }),
            next: { revalidate: 0 }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data: UazapiResponse<UazapiMessage> = await response.json();

        // Normalize message types
        const messages = data.messages || data.response || [];
        messages.forEach(msg => {
            if (msg.messageType) {
                msg.messageType = normalizeMessageType(msg.messageType);
            }
        });

        return data;
    } catch (error: any) {
        console.error("fetchMessages error:", error);
        return { response: [], count: 0, status: 500, error: error.message };
    }
}

export async function getLeadDetails(phone: string) {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('session');

        if (!session?.value) {
            return null;
        }

        const userId = parseInt(session.value);
        // Sanitize phone: remove non-digits
        // Standardize: if starts with +55, keeps it. If 55, keeps it. 
        // The table likely has formatting or just digits. 
        // The check_schema showed '553182964672' (just digits).
        const sanitizedPhone = phone.replace(/\D/g, '');

        const supabase = createClient();

        // Try to find the lead
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('id_empresa', userId)
            .eq('telefone', sanitizedPhone)
            .maybeSingle();

        if (error) {
            console.error("getLeadDetails error:", error);
            return null;
        }

        return data;
    } catch (error) {
        console.error("getLeadDetails exception:", error);
        return null;
    }


}

export async function sendMessage(chatId: string, text: string) {
    try {
        const { token, url } = await getCredentials();
        // Correct Uazapi endpoint for sending text messages
        const endpoint = `${url}/send/text`;

        // Extract number from chatId (remove @s.whatsapp.net if present)
        const number = chatId.includes('@') ? chatId.split('@')[0] : chatId;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'token': token,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                number: number,
                text: text,
                delay: 1200
            }),
            next: { revalidate: 0 }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`sendMessage API Error: ${response.status} - ${errorBody}`);
            throw new Error(`Falha ao enviar mensagem: ${response.status}`);
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error: any) {
        console.error("sendMessage error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteMessage(chatId: string, messageId: string) {
    try {
        const { token, url } = await getCredentials();
        const endpoint = `${url}/message/delete`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: messageId
            }),
            next: { revalidate: 0 }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`deleteMessage API Error: ${response.status} - ${errorBody}`);
            throw new Error(`Falha ao deletar mensagem: ${response.status}`);
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error: any) {
        console.error("deleteMessage error:", error);
        return { success: false, error: error.message };
    }
}

export async function toggleLeadAI(phone: string, isEnabled: boolean) {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('session');

        if (!session?.value) {
            throw new Error("Usuário não autenticado");
        }

        const userId = parseInt(session.value);
        const sanitizedPhone = phone.replace(/\D/g, '');

        const supabase = createClient();

        // Check if lead exists first or update directly
        const { data, error } = await supabase
            .from('leads')
            .update({ 'IA_responde': isEnabled })
            .eq('id_empresa', userId)
            .eq('telefone', sanitizedPhone)
            .select();

        if (error) {
            console.error("toggleLeadAI error:", error);
            throw new Error(`Falha ao atualizar IA: ${error.message}`);
        }

        return { success: true, data };
    } catch (error: any) {
        console.error("toggleLeadAI exception:", error);
        return { success: false, error: error.message };
    }
}

export async function resendLatestMessages(name: string, phone: string, text: string) {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('session');
        if (!session?.value) throw new Error("Usuário não autenticado");

        const supabase = createClient();
        const { data: attendant, error } = await supabase
            .from('empresa')
            .select('id, telefone')
            .eq('id', session.value)
            .single();

        if (error || !attendant) {
            console.error("Attendant info error:", error);
            throw new Error("Informações do atendente não encontradas");
        }

        const webhookUrl = 'https://n8n-n8n.0js9zt.easypanel.host/webhook/reenvio_mensagem_allservice_adv';

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                phone: phone.replace(/\D/g, ''),
                text,
                atendente_phone: attendant.telefone,
                atendente_id: attendant.id
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`resendLatestMessages Webhook Error: ${response.status} - ${errorText}`);
            throw new Error(`Falha no webhook: ${response.status}`);
        }

        return { success: true };
    } catch (error: any) {
        console.error("resendLatestMessages error:", error);
        return { success: false, error: error.message };
    }
}
export async function updateLeadStatus(phone: string, newStatus: string) {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('session');

        if (!session?.value) {
            throw new Error("Usuário não autenticado");
        }

        const userId = parseInt(session.value);
        const sanitizedPhone = phone.replace(/\D/g, '');

        const supabase = createClient();

        // Update lead status
        const { data, error } = await supabase
            .from('leads')
            .update({ 'Status': newStatus })
            .eq('id_empresa', userId)
            .eq('telefone', sanitizedPhone)
            .select();

        if (error) {
            console.error("updateLeadStatus error:", error);
            throw new Error(`Falha ao atualizar Status: ${error.message}`);
        }

        return { success: true, data };
    } catch (error: any) {
        console.error("updateLeadStatus exception:", error);
        return { success: false, error: error.message };
    }
}
