
export interface UazapiChat {
    id: string; // Internal UUID
    wa_chatid: string; // e.g. "5511999999999@s.whatsapp.net"
    wa_name?: string;
    wa_contactName?: string;
    name?: string;
    phone?: string;
    wa_lastMsgTimestamp: number;
    wa_unreadCount: number;
    wa_isGroup: boolean;
    wa_lastMessageType?: string;
    wa_lastMessageTextVote?: string; // Often contains the last message text
    wa_lastMessageText?: string;
    image?: string;
    last_message?: { // Legacy or alternative
        message: string;
        type: string;
        fromMe: boolean;
    };
    profileParams?: {
        imgUrl?: string;
    };
}

export interface UazapiMessage {
    id: string;
    messageid: string;
    chatid: string;
    text: string;
    messageType: string;
    messageTimestamp: number;
    fromMe: boolean;
    senderName?: string;
    fileURL?: string;
}

export interface UazapiResponse<T> {
    response?: T[]; // Some endpoints return this
    chats?: T[];    // /chat/find might return this
    messages?: T[]; // /message/find might return this
    pagination?: {
        currentPage: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        pageSize: number;
        totalPages: number;
        totalRecords: number;
    };
    // Error handling fields (custom added by action)
    status?: number;
    error?: string;
    count?: number; // Legacy or alternative endpoints
}
