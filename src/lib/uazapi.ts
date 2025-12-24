
export interface UazapiChat {
    id: string; // e.g. "5511999999999@s.whatsapp.net"
    wa_name: string;
    wa_pushname?: string;
    wa_lastMsgTimestamp: number;
    wa_unreadCount: number;
    wa_isGroup: boolean;
    lead_status?: string;
    lead_name?: string;
    last_message?: {
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
    wa_messageId: string;
    wa_contactId: string;
    wa_name: string;
    wa_body: string;
    wa_type: string;
    wa_timestamp: number;
    wa_fromMe: boolean;
    wa_isForwarded?: boolean;
    mediaUrl?: string; // Derived or if available
}

export interface UazapiResponse<T> {
    response: T[];
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
