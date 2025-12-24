
'use client';

import { useState, useEffect } from 'react';
import { fetchChats, fetchMessages } from './actions';
import { UazapiChat, UazapiMessage } from '@/lib/uazapi';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, Phone, MoreVertical, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";

export default function ChatsPage() {
    const [chats, setChats] = useState<UazapiChat[]>([]);
    const [selectedChat, setSelectedChat] = useState<UazapiChat | null>(null);
    const [messages, setMessages] = useState<UazapiMessage[]>([]);
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadChats();
    }, []);

    useEffect(() => {
        if (selectedChat) {
            loadMessages(selectedChat.id);
        }
    }, [selectedChat]);

    async function loadChats() {
        setLoadingChats(true);
        setError(null);
        try {
            const res = await fetchChats();

            if (res.error) {
                console.error("Chats error from server:", res.error);
                setError(res.error);
            } else if (res.chats || res.response) {
                const data = res.chats || res.response || [];
                setChats(data);
            }
        } catch (err) {
            console.error("Unexpected error in loadChats:", err);
            setError("Erro inesperado ao carregar chats.");
        }
        setLoadingChats(false);
    }

    async function loadMessages(chatId: string) {
        setLoadingMessages(true);
        const res = await fetchMessages(chatId);
        const data = res.messages || res.response;
        if (data) {
            // Reverse so oldest is at top for standard chat view
            setMessages(data.reverse());
        }
        setLoadingMessages(false);
    }

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden p-6 gap-6">
            {/* Chat List */}
            <Card className="w-1/3 flex flex-col bg-card/50 backdrop-blur-sm border-border">
                <div className="p-4 border-b border-border space-y-4">
                    <h2 className="text-xl font-semibold text-foreground">Conversas</h2>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar conversas..." className="pl-8 bg-background/50 border-input" />
                    </div>
                </div>
                {error && (
                    <div className="p-4 m-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                        {error}
                    </div>
                )}
                <ScrollArea className="flex-1">
                    {loadingChats ? (
                        <div className="p-4 text-center text-muted-foreground">Carregando...</div>
                    ) : (
                        <div className="flex flex-col gap-1 p-2">
                            {chats.map(chat => (
                                <button
                                    key={chat.id}
                                    onClick={() => setSelectedChat(chat)}
                                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${selectedChat?.id === chat.id
                                        ? 'bg-primary/20 hover:bg-primary/30'
                                        : 'hover:bg-muted/50'
                                        }`}
                                >
                                    <Avatar>
                                        <AvatarImage src={chat.profileParams?.imgUrl} />
                                        <AvatarFallback>{chat.wa_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-medium truncate text-sm text-foreground">
                                                {chat.wa_name || chat.id.split('@')[0]}
                                            </span>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                {chat.wa_lastMsgTimestamp ? format(new Date(chat.wa_lastMsgTimestamp), 'HH:mm', { locale: ptBR }) : ''}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {chat.last_message?.message || "Sem mensagens"}
                                        </p>
                                    </div>
                                    {chat.wa_unreadCount > 0 && (
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                                            {chat.wa_unreadCount}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </Card>

            {/* Message Area */}
            <Card className="flex-1 flex flex-col bg-card/50 backdrop-blur-sm border-border">
                {selectedChat ? (
                    <>
                        <div className="p-4 border-b border-border flex justify-between items-center bg-card/80">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={selectedChat.profileParams?.imgUrl} />
                                    <AvatarFallback>{selectedChat.wa_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-foreground">{selectedChat.wa_name}</h3>
                                    <p className="text-xs text-muted-foreground">{selectedChat.id.split('@')[0]}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 text-muted-foreground">
                                <Phone className="h-5 w-5 cursor-pointer hover:text-foreground" />
                                <MoreVertical className="h-5 w-5 cursor-pointer hover:text-foreground" />
                            </div>
                        </div>

                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4 flex flex-col">
                                {loadingMessages ? (
                                    <div className="text-center text-muted-foreground mt-10">Carregando mensagens...</div>
                                ) : (
                                    messages.map(msg => (
                                        <div
                                            key={msg.id}
                                            className={`max-w-[70%] p-3 rounded-2xl text-sm ${msg.wa_fromMe
                                                ? 'bg-primary/20 text-foreground self-end rounded-br-none'
                                                : 'bg-muted text-foreground self-start rounded-bl-none'
                                                }`}
                                        >
                                            <p>{msg.wa_body}</p>
                                            <span className="text-[10px] opacity-70 block text-right mt-1">
                                                {format(new Date(msg.wa_timestamp), 'HH:mm')}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>

                        <div className="p-4 border-t border-border bg-card/80">
                            <div className="flex gap-2">
                                <Input placeholder="Digite uma mensagem..." className="flex-1 bg-background" />
                                <button className="p-2 bg-primary rounded-md text-primary-foreground hover:bg-primary/90">
                                    <MessageSquare className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
                        <p>Selecione uma conversa para visualizar</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
