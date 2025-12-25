
'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchChats, fetchMessages, getLeadDetails, sendMessage, deleteMessage, toggleLeadAI, resendLatestMessages, updateLeadStatus } from './actions';
import { UazapiChat, UazapiMessage } from '@/lib/uazapi';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import {
    Search,
    MessageSquare,
    MoreVertical,
    Phone,
    Trash2,
    Plus,
    Bot,
    User,
    CheckCircle2,
    SlidersHorizontal,
    Loader2,
    SendHorizonal,
    ArrowLeft
} from 'lucide-react';
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

function ChatsContent() {
    const searchParams = useSearchParams();
    const phoneParam = searchParams.get('phone');

    const [chats, setChats] = useState<UazapiChat[]>([]);
    const [selectedChat, setSelectedChat] = useState<UazapiChat | null>(null);
    const [messages, setMessages] = useState<UazapiMessage[]>([]);
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [inputText, setInputText] = useState('');

    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const observer = useRef<IntersectionObserver | null>(null);

    // Lead Profile State
    const [leadDetails, setLeadDetails] = useState<any>(null);
    const [showProfile, setShowProfile] = useState(false);

    // AI FAB State
    const [isFabOpen, setIsFabOpen] = useState(false);
    const [isAIEnabled, setIsAIEnabled] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [aiFilter, setAiFilter] = useState<'all' | 'ai' | 'human'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Em andamento' | 'Concluído' | 'Desqualificado'>('all');
    const [questionFilter, setQuestionFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    // Initial load
    useEffect(() => {
        loadChats(1, true);

        // Polling for NEW chats (only first page)
        const interval = setInterval(() => {
            refreshFirstPage();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    // Polling for messages when chat selected
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (selectedChat) {
            loadMessages(selectedChat.wa_chatid); // Initial load when clicked
            interval = setInterval(() => {
                loadMessages(selectedChat.wa_chatid, false);
            }, 5000); // 5s polling
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [selectedChat]);

    // Sync AI state when details load
    useEffect(() => {
        if (leadDetails) {
            const aiStatus = leadDetails.IA_responde === true || leadDetails.IA_responde === 'true';
            setIsAIEnabled(aiStatus);
        } else {
            setIsAIEnabled(false);
        }
    }, [leadDetails]);

    // Auto-select chat from query param
    useEffect(() => {
        if (phoneParam && chats.length > 0 && !selectedChat) {
            const sanitizedPhone = phoneParam.replace(/\D/g, '');
            const chat = chats.find(c => {
                const p = (c.phone || c.wa_chatid.split('@')[0]).replace(/\D/g, '');
                return p === sanitizedPhone;
            });
            if (chat) {
                handleChatSelect(chat);
                // Clear the param or at least stop trying to select it once selected
            } else if (!loadingChats && !loadingMore && hasMore && page < 5) {
                // If not found in first few pages, try to load more automatically
                // but limit to 5 pages to avoid infinite loops or heavy loads
                loadChats(page + 1);
            }
        }
    }, [phoneParam, chats, selectedChat, loadingChats, loadingMore, hasMore, page]);

    async function loadChats(pageNum: number, isInitial = false) {
        if (isInitial) setLoadingChats(true);
        else setLoadingMore(true);

        try {
            const res = await fetchChats(pageNum, 20);
            const newChats = res.chats || res.response || [];

            if (pageNum === 1) {
                setChats(newChats);
            } else {
                setChats(prev => {
                    // Avoid duplicates if polling overlapped
                    const existingIds = new Set(prev.map(c => c.wa_chatid));
                    const filtered = newChats.filter(c => !existingIds.has(c.wa_chatid));
                    return [...prev, ...filtered];
                });
            }

            // If we got fewer than 20, assume no more
            setHasMore(newChats.length === 20);
            setPage(pageNum);
        } catch (error) {
            console.error("Error loading chats:", error);
        } finally {
            if (isInitial) setLoadingChats(false);
            setLoadingMore(false);
        }
    }

    // Just refresh the first page to see new messages without losing scroll or appending infinitely
    async function refreshFirstPage() {
        try {
            const res = await fetchChats(1, 20);
            const firstPageChats = res.chats || res.response || [];

            setChats(prev => {
                const combined = [...firstPageChats];
                // Keep chats that were already loaded in subsequent pages
                const firstPageIds = new Set(firstPageChats.map(c => c.wa_chatid));
                const otherChats = prev.filter(c => !firstPageIds.has(c.wa_chatid));
                return [...combined, ...otherChats].sort((a, b) => (b.wa_lastMsgTimestamp || 0) - (a.wa_lastMsgTimestamp || 0));
            });
        } catch (e) {
            console.error("Refresh error:", e);
        }
    }

    const lastChatElementRef = useCallback((node: HTMLDivElement) => {
        if (loadingChats || loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadChats(page + 1);
            }
        });

        if (node) observer.current.observe(node);
    }, [loadingChats, loadingMore, hasMore, page]);

    async function loadMessages(chatId: string, forceScroll = false) {
        if (!chatId) return;
        if (forceScroll) setLoadingMessages(true);

        const res = await fetchMessages(chatId);
        if (res.messages || res.response) {
            const msgs = (res.messages || res.response || []).reverse();
            setMessages(msgs);

            if (forceScroll) {
                setTimeout(() => {
                    const scrollArea = document.getElementById('message-area-scroll');
                    if (scrollArea) {
                        const scrollContainer = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
                        if (scrollContainer) {
                            scrollContainer.scrollTop = scrollContainer.scrollHeight;
                        }
                    }
                }, 100);
            }
        }
        if (forceScroll) setLoadingMessages(false);
    }

    async function handleChatSelect(chat: UazapiChat) {
        setSelectedChat(chat);
        setLoadingMessages(true);
        setMessages([]);
        setShowProfile(false);
        setLeadDetails(null);
        setIsFabOpen(false);
        setIsAIEnabled(false);

        if (chat.phone || chat.wa_chatid) {
            const phone = chat.phone || chat.wa_chatid.split('@')[0];
            const details = await getLeadDetails(phone);
            setLeadDetails(details);

            // Update local chat list status if it changed
            if (details) {
                const completed = details.Status === 'Concluído';
                setChats(prev => prev.map(c =>
                    c.wa_chatid === chat.wa_chatid ? { ...c, isCompleted: completed } : c
                ));
            }
        }

        await loadMessages(chat.wa_chatid, true);
    }

    async function handleSendMessage() {
        if (!selectedChat || !inputText.trim()) return;
        const text = inputText;
        setInputText('');

        try {
            const tempId = Date.now().toString();
            const tempMsg: UazapiMessage = {
                id: tempId,
                messageid: tempId,
                chatid: selectedChat.wa_chatid,
                text: text,
                messageType: 'text',
                messageTimestamp: Date.now(),
                fromMe: true
            };
            setMessages(prev => [...prev, tempMsg]);

            const res = await sendMessage(selectedChat.wa_chatid, text);
            if (res.success) {
                loadMessages(selectedChat.wa_chatid, true);
            } else {
                setMessages(prev => prev.filter(m => m.id !== tempId));
                toast.error("Erro ao enviar mensagem");
            }
        } catch (e) {
            console.error("Handler error:", e);
        }
    }

    async function handleDeleteMessage(messageId: string) {
        if (!selectedChat) return;
        const originalMessages = [...messages];

        // Optimistic update: mark as deleted instead of removing
        setMessages(prev => prev.map(m =>
            (m.id === messageId || m.messageid === messageId)
                ? { ...m, status: 'Deleted', text: 'Esta mensagem foi apagada' }
                : m
        ));

        const res = await deleteMessage(selectedChat.wa_chatid, messageId);
        if (!res.success) {
            toast.error("Erro ao apagar mensagem");
            setMessages(originalMessages);
        } else {
            toast.success("Mensagem apagada para todos");
        }
    }

    async function handleToggleAI(enabled: boolean) {
        if (!selectedChat) return;
        const prev = isAIEnabled;
        setIsAIEnabled(enabled);

        const phone = selectedChat.phone || selectedChat.wa_chatid.split('@')[0];
        const res = await toggleLeadAI(phone, enabled);

        if (res.success) {
            toast.success(enabled ? "IA Ativada" : "IA Desativada");
            if (leadDetails) {
                setLeadDetails({ ...leadDetails, IA_responde: enabled });
            }
            // Update the chat item in the list immediately
            setChats(prev => prev.map(c => {
                const currentPhone = (c.phone || c.wa_chatid.split('@')[0]).replace(/\D/g, '');
                if (currentPhone === phone) {
                    return { ...c, isAIEnabled: enabled };
                }
                return c;
            }));
        } else {
            setIsAIEnabled(prev);
            toast.error("Erro ao alterar status da IA");
        }
    }

    async function handleResendMessages() {
        if (!selectedChat || messages.length === 0) return;

        setIsResending(true);
        try {
            // Traverse from newest to oldest to find consecutive client messages
            const clientMessages = [];
            for (let i = messages.length - 1; i >= 0; i--) {
                const msg = messages[i];
                if (msg.fromMe === false) {
                    clientMessages.unshift(msg.text || '');
                } else {
                    break;
                }
            }

            if (clientMessages.length === 0) {
                toast.error("Nenhuma mensagem recente do cliente encontrada.");
                return;
            }

            const consolidatedText = clientMessages.join('\n');
            const name = selectedChat.wa_name || selectedChat.wa_contactName || selectedChat.name || "Sem Nome";
            const phone = selectedChat.phone || selectedChat.wa_chatid.split('@')[0];

            const res = await resendLatestMessages(name, phone, consolidatedText);
            if (res.success) {
                toast.success("Mensagens reenviadas para o n8n!");
            } else {
                toast.error(`Falha no reenvio: ${res.error}`);
            }
        } catch (e: any) {
            console.error("Resend error:", e);
            toast.error("Erro interno ao reenviar mensagens");
        } finally {
            setIsResending(false);
        }
    }

    async function handleStatusChange(newStatus: string) {
        if (!selectedChat) return;
        const phone = selectedChat.phone || selectedChat.wa_chatid.split('@')[0];

        // Optimistic update
        if (leadDetails) {
            setLeadDetails({ ...leadDetails, Status: newStatus });
        }

        const res = await updateLeadStatus(phone, newStatus);

        if (res.success) {
            toast.success(`Status atualizado para: ${newStatus}`);
            // Update list status as well
            setChats(prev => prev.map(c =>
                c.wa_chatid === selectedChat.wa_chatid ? { ...c, status: newStatus, isCompleted: newStatus === 'Concluído' } : c
            ));
        } else {
            toast.error("Erro ao atualizar status");
            // Revert if needed, but we'll fetch details again anyway
        }
    }

    const filteredChats = chats.filter(chat => {
        const name = (chat.wa_name || chat.wa_contactName || chat.name || chat.wa_chatid || '').toLowerCase();
        const matchesSearch = name.includes(searchQuery.toLowerCase());

        let matchesAI = true;
        if (aiFilter === 'ai') matchesAI = chat.isAIEnabled === true;
        else if (aiFilter === 'human') matchesAI = chat.isAIEnabled !== true;

        let matchesStatus = true;
        if (statusFilter !== 'all') {
            // chat.isCompleted is already based on Status === 'Concluído'
            // We need to ensure fetchChats returns leadData.Status so we can set it on chat
            matchesStatus = chat.status === statusFilter;
        }

        let matchesQuestion = true;
        if (questionFilter !== 'all') {
            const key = questionFilter.toLowerCase() as keyof UazapiChat;
            const val = chat[key];
            matchesQuestion = val !== null && val !== undefined && val !== '';
        }

        return matchesSearch && matchesAI && matchesStatus && matchesQuestion;
    });

    // Automatically load more if filtered list is empty but we have more pages
    useEffect(() => {
        const isFiltered = aiFilter !== 'all' || statusFilter !== 'all' || questionFilter !== 'all';
        if (!loadingChats && !loadingMore && hasMore && filteredChats.length === 0 && isFiltered) {
            const timer = setTimeout(() => {
                loadChats(page + 1);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [filteredChats.length, aiFilter, statusFilter, questionFilter, hasMore, loadingChats, loadingMore, page]);

    const getLastMessageDisplay = (chat: UazapiChat) => {
        if (chat.wa_lastMessageTextVote) return chat.wa_lastMessageTextVote;
        if (chat.wa_lastMessageText) return chat.wa_lastMessageText;
        if (chat.last_message?.message) return chat.last_message.message;
        if (chat.wa_lastMessageType && chat.wa_lastMessageType !== 'text') return `[${chat.wa_lastMessageType}]`;
        return '';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Concluído':
                return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'Desqualificado':
                return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'Em andamento':
                return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            default:
                return 'text-muted-foreground bg-muted/50 border-border';
        }
    };

    return (
        <div className="flex h-full overflow-hidden">
            {/* Chat List Sider - Full width on mobile, hidden when chat selected */}
            <div className={`w-full md:w-[350px] border-r border-border bg-card flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-border space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar conversa..."
                                className="pl-8 bg-background"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 rounded-md transition-all border ${showFilters || aiFilter !== 'all' || statusFilter !== 'all' || questionFilter !== 'all' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-background hover:bg-muted border-transparent text-muted-foreground'}`}
                            title="Filtros"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                        </button>
                    </div>

                    {showFilters && (
                        <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">Tipo</span>
                                <div className="flex gap-1 bg-muted/50 p-1 rounded-md">
                                    <button
                                        onClick={() => setAiFilter('all')}
                                        className={`flex-1 py-1 text-[10px] font-medium rounded transition-all ${aiFilter === 'all' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Todos
                                    </button>
                                    <button
                                        onClick={() => setAiFilter('ai')}
                                        className={`flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-medium rounded transition-all ${aiFilter === 'ai' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <Bot className="h-3 w-3" />
                                        IA
                                    </button>
                                    <button
                                        onClick={() => setAiFilter('human')}
                                        className={`flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-medium rounded transition-all ${aiFilter === 'human' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <User className="h-3 w-3" />
                                        Humano
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">Status</span>
                                <div className="grid grid-cols-2 gap-1 bg-muted/50 p-1 rounded-md">
                                    {(['all', 'Em andamento', 'Concluído', 'Desqualificado'] as const).map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setStatusFilter(s)}
                                            className={`py-1 text-[10px] font-medium rounded transition-all ${statusFilter === s ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            {s === 'all' ? 'Todos' : s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">Etapa Alcançada</span>
                                <div className="grid grid-cols-4 gap-1 bg-muted/50 p-1 rounded-md max-h-[120px] overflow-y-auto custom-scrollbar">
                                    <button
                                        onClick={() => setQuestionFilter('all')}
                                        className={`py-1 text-[10px] font-medium rounded transition-all ${questionFilter === 'all' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Todas
                                    </button>
                                    {(['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'] as const).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setQuestionFilter(t)}
                                            className={`py-1 text-[10px] font-medium rounded transition-all ${questionFilter === t ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <ScrollArea className="flex-1 min-h-0">
                    <div className="flex flex-col">
                        {loadingChats ? (
                            <div className="p-4 text-center text-muted-foreground">Carregando...</div>
                        ) : (
                            <>
                                {filteredChats.map((chat) => (
                                    <div
                                        key={chat.id || chat.wa_chatid}
                                        className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors flex gap-3 relative ${selectedChat?.wa_chatid === chat.wa_chatid ? 'bg-muted' : ''}`}
                                        onClick={() => handleChatSelect(chat)}
                                    >
                                        <Avatar>
                                            <AvatarImage src={chat.image || chat.profileParams?.imgUrl} />
                                            <AvatarFallback>{(chat.wa_name || chat.wa_contactName || chat.name || "U")?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    {chat.isCompleted && (
                                                        <div title="Atendimento Concluído">
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                                        </div>
                                                    )}
                                                    {chat.isAIEnabled ? (
                                                        <div title="Atendimento por IA">
                                                            <Bot className="h-3.5 w-3.5 text-primary shrink-0" />
                                                        </div>
                                                    ) : (
                                                        <div title="Atendimento Humano">
                                                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                        </div>
                                                    )}
                                                    <h3 className="font-semibold truncate text-sm">{chat.wa_name || chat.wa_contactName || chat.name || chat.wa_chatid}</h3>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap mr-2">
                                                    {chat.wa_lastMsgTimestamp ? format(new Date(chat.wa_lastMsgTimestamp * 1000), 'dd/MM HH:mm') : ''}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate pr-4">
                                                {getLastMessageDisplay(chat)}
                                            </p>
                                        </div>

                                        {/* Status Indicator - Absolute Positioned */}
                                        {chat.status && (
                                            <div
                                                className={`absolute top-3 right-3 h-3 w-3 rounded-full border border-background shadow-sm z-50 ${chat.status.toLowerCase() === 'concluído' || chat.status.toLowerCase() === 'concluido' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                                                    chat.status.toLowerCase() === 'desqualificado' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                                                        chat.status.toLowerCase() === 'em andamento' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]' :
                                                            'bg-gray-400'
                                                    }`}
                                                title={chat.status}
                                            />
                                        )}
                                        {chat.wa_unreadCount > 0 && (
                                            <div className="flex flex-col justify-center">
                                                <span className="h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-medium">
                                                    {chat.wa_unreadCount}
                                                </span>
                                            </div>
                                        )
                                        }
                                    </div>
                                ))}

                                {filteredChats.length === 0 && !loadingMore && !loadingChats && (
                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                        Nenhuma conversa encontrada.
                                    </div>
                                )}

                                {hasMore && (
                                    <div ref={lastChatElementRef} className="p-4 flex justify-center items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        {loadingMore && <span className="text-xs text-muted-foreground">Carregando mais...</span>}
                                    </div>
                                )}

                                {!hasMore && filteredChats.length > 0 && (
                                    <div className="p-4 text-center text-[10px] text-muted-foreground opacity-50 uppercase tracking-wider">
                                        Fim das conversas
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </ScrollArea>
            </div >

            {/* Message Area - Full width on mobile, hidden when no chat selected */}
            < Card className={`flex-1 flex flex-row bg-card/50 backdrop-blur-sm border-none rounded-none overflow-hidden relative ${selectedChat ? 'flex' : 'hidden md:flex'}`
            }>
                <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 relative ${showProfile ? 'mr-[0px]' : ''}`}>
                    {selectedChat ? (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b border-border flex justify-between items-center bg-card/80">
                                <div className="flex items-center gap-3">
                                    {/* Back button for mobile */}
                                    <button
                                        className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setSelectedChat(null)}
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>
                                    <div
                                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => setShowProfile(!showProfile)}
                                    >
                                        <Avatar>
                                            <AvatarImage src={selectedChat.image || selectedChat.profileParams?.imgUrl} />
                                            <AvatarFallback>{(selectedChat.wa_name || selectedChat.wa_contactName || selectedChat.name || "U")?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold text-foreground">{selectedChat.wa_name || selectedChat.wa_contactName || selectedChat.name}</h3>
                                            <p className="text-xs text-muted-foreground">
                                                {selectedChat.phone || `+${selectedChat.wa_chatid.split('@')[0]}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center text-muted-foreground bg-card">
                                    {/* Status Selector */}
                                    {leadDetails && (
                                        <div className="mr-2">
                                            <Select
                                                value={leadDetails.Status || leadDetails.status || "Em andamento"}
                                                onValueChange={handleStatusChange}
                                            >
                                                <SelectTrigger className={`w-[140px] h-8 text-xs font-medium border ${getStatusColor(leadDetails.Status || leadDetails.status || "Em andamento")}`}>
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Em andamento" className="text-yellow-500">Em andamento</SelectItem>
                                                    <SelectItem value="Concluído" className="text-green-500">Concluído</SelectItem>
                                                    <SelectItem value="Desqualificado" className="text-red-500">Desqualificado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    <Phone className="h-5 w-5 cursor-pointer hover:text-foreground" />
                                    <MoreVertical className="h-5 w-5 cursor-pointer hover:text-foreground" onClick={() => setShowProfile(!showProfile)} />
                                </div>
                            </div>

                            <ScrollArea id="message-area-scroll" className="flex-1 min-h-0 p-4">
                                <div className="space-y-4 flex flex-col pb-16">
                                    {loadingMessages ? (
                                        <div className="text-center text-muted-foreground mt-10">Carregando mensagens...</div>
                                    ) : (
                                        messages.map(msg => (
                                            <div
                                                key={msg.id}
                                                className={`max-w-[70%] p-3 rounded-2xl text-sm relative group ${msg.fromMe
                                                    ? 'bg-primary/20 text-foreground self-end rounded-br-none'
                                                    : 'bg-muted text-foreground self-start rounded-bl-none'
                                                    } ${msg.status === 'Deleted' ? 'opacity-60 italic' : ''}`}
                                            >
                                                {msg.fromMe && msg.status !== 'Deleted' && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <button
                                                                className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-destructive hover:bg-destructive/10 rounded-full transition-all"
                                                                title="Apagar para todos"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Apagar mensagem?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Esta ação apagará a mensagem para todos os participantes da conversa.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeleteMessage(msg.id || msg.messageid)}
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                >
                                                                    Apagar para todos
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                                <div className="flex flex-col gap-1">
                                                    {['audio', 'ptt', 'voice'].includes(msg.messageType) ? (
                                                        msg.fileURL ? (
                                                            <audio controls src={msg.fileURL} className="max-w-[240px]" />
                                                        ) : (
                                                            <span className="italic opacity-70">🎙️ Áudio indisponível</span>
                                                        )
                                                    ) : msg.messageType === 'image' ? (
                                                        msg.fileURL ? (
                                                            <img src={msg.fileURL} alt="Imagem" className="max-w-[240px] rounded-lg cursor-pointer hover:opacity-90" onClick={() => window.open(msg.fileURL, '_blank')} />
                                                        ) : (
                                                            <span className="italic opacity-70">📷 Foto indisponível</span>
                                                        )
                                                    ) : msg.messageType === 'video' ? (
                                                        msg.fileURL ? (
                                                            <video controls src={msg.fileURL} className="max-w-[240px] rounded-lg" />
                                                        ) : (
                                                            <span className="italic opacity-70">🎥 Vídeo indisponível</span>
                                                        )
                                                    ) : msg.messageType === 'document' ? (
                                                        msg.fileURL ? (
                                                            <a href={msg.fileURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-500 hover:underline">
                                                                📄 Documento
                                                            </a>
                                                        ) : (
                                                            <span className="italic opacity-70">📄 Documento indisponível</span>
                                                        )
                                                    ) : msg.status === 'Deleted' ? (
                                                        <p className="flex items-center gap-1.5 opacity-70">
                                                            <Trash2 className="h-3 w-3" />
                                                            Mensagem apagada
                                                        </p>
                                                    ) : (
                                                        <p>{msg.text}</p>
                                                    )}

                                                    {/* Caption */}
                                                    {(msg.messageType === 'image' || msg.messageType === 'video') && msg.text && msg.text !== 'image' && msg.text !== 'video' && (
                                                        <p className="mt-1">{msg.text}</p>
                                                    )}
                                                </div>
                                                <span className="text-[10px] opacity-70 block text-right mt-1">
                                                    {format(new Date(msg.messageTimestamp), 'HH:mm')}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>

                            {/* FAB Area - Bottom Left of the Chat Area */}
                            <div className="absolute bottom-20 left-4 z-20 flex flex-col gap-2">
                                {/* Resend Messages Button (only if lead not found) */}
                                {leadDetails === null && (
                                    <button
                                        className="h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-all hover:bg-primary/90 disabled:opacity-50"
                                        onClick={handleResendMessages}
                                        disabled={isResending || messages.length === 0}
                                        title="Reenvio de últimas mensagens"
                                    >
                                        {isResending ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <SendHorizonal className="h-5 w-5" />
                                        )}
                                    </button>
                                )}

                                <div className={`flex items-center gap-2 bg-card border border-border p-2 rounded-lg shadow-lg transition-all duration-300 origin-bottom-left ${isFabOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                                    <Switch
                                        id="ai-mode"
                                        checked={isAIEnabled}
                                        onCheckedChange={handleToggleAI}
                                    />
                                    <Label htmlFor="ai-mode" className="text-sm cursor-pointer flex items-center gap-1">
                                        <Bot className="h-4 w-4" />
                                        IA {isAIEnabled ? 'On' : 'Off'}
                                    </Label>
                                </div>

                                <button
                                    className={`h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-transform duration-300 ${isFabOpen ? 'rotate-45' : 'rotate-0'}`}
                                    onClick={() => setIsFabOpen(!isFabOpen)}
                                >
                                    <Plus className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="p-4 border-t border-border bg-card/80">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Digite uma mensagem..."
                                        className="flex-1 bg-background"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSendMessage();
                                        }}
                                    />
                                    <button
                                        className="p-2 bg-primary rounded-md text-primary-foreground hover:bg-primary/90"
                                        onClick={handleSendMessage}
                                        disabled={!inputText.trim()}
                                    >
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
                </div>

                {/* Profile Panel */}
                {
                    selectedChat && showProfile && (
                        <div className="w-[300px] border-l border-border bg-card overflow-y-auto p-4 animate-in slide-in-from-right duration-300 absolute inset-y-0 right-0 shadow-lg z-10">
                            <div className="flex flex-col items-center mb-6">
                                <Avatar className="h-20 w-20 mb-3">
                                    <AvatarImage src={selectedChat.image || selectedChat.profileParams?.imgUrl} />
                                    <AvatarFallback>{(selectedChat.wa_name || selectedChat.wa_contactName || selectedChat.name || "U")?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <h2 className="text-lg font-light text-center">{selectedChat.wa_name || selectedChat.wa_contactName}</h2>
                                <p className="text-sm text-muted-foreground">{selectedChat.phone || `+${selectedChat.wa_chatid.split('@')[0]}`}</p>
                            </div>

                            {leadDetails ? (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xs font-medium uppercase text-muted-foreground mb-2">Informações do Lead</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Status:</span>
                                                <span className="font-medium text-foreground">{leadDetails.Status || leadDetails.status || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Criado em:</span>
                                                <span className="font-medium text-foreground">
                                                    {leadDetails.created_at ? format(new Date(leadDetails.created_at), 'dd/MM/yyyy') : '-'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Follow-up 1:</span>
                                                <span className={`font-medium ${leadDetails.follow_up_1_enviado ? 'text-green-500' : 'text-foreground'}`}>
                                                    {leadDetails.follow_up_1_enviado ? 'Enviado' : 'Pendente'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Follow-up 2:</span>
                                                <span className={`font-medium ${leadDetails.follow_up_2_enviado ? 'text-green-500' : 'text-foreground'}`}>
                                                    {leadDetails.follow_up_2_enviado ? 'Enviado' : 'Pendente'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {leadDetails['resumo da conversa'] && (
                                        <div>
                                            <h3 className="text-xs font-medium uppercase text-muted-foreground mb-2">Resumo</h3>
                                            <p className="text-sm bg-muted/30 p-2 rounded-md border border-border">
                                                {leadDetails['resumo da conversa']}
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="text-xs font-medium uppercase text-muted-foreground mb-2">Perguntas Respondidas</h3>
                                        <div className="space-y-1 text-sm">
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => {
                                                const val = leadDetails[`t${i}`];
                                                if (val === true || val === 'true' || val === 'TRUE') {
                                                    return (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <span className="h-4 w-4 bg-green-500/20 text-green-500 rounded flex items-center justify-center text-[10px] font-medium">✓</span>
                                                            <span>Pergunta T{i}</span>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })}
                                            {![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].some(i => leadDetails[`t${i}`] === true) && (
                                                <span className="text-muted-foreground italic text-xs">Nenhuma resposta registrada.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 text-center border border-dashed border-border rounded-lg bg-muted/20">
                                        <p className="text-sm text-muted-foreground">
                                            Lead não encontrado na base de dados para este telefone.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }
            </Card >
        </div >
    );
}

export default function ChatsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-full items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-zinc-500 font-light">Carregando conversas...</p>
                </div>
            </div>
        }>
            <ChatsContent />
        </Suspense>
    );
}
