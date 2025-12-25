"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { updateLeadStatus } from "./actions"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { Phone, Calendar, User as UserIcon, MessageCircle, Info, Bot, UserCheck } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface Lead {
    id: string | number
    nome: string
    telefone: string
    Status: string
    created_at: string
    "resumo da conversa"?: string
    t1?: string; t2?: string; t3?: string; t4?: string; t5?: string;
    t6?: string; t7?: string; t8?: string; t9?: string; t10?: string;
    t11?: string; t12?: string;
    follow_up_1_enviado?: boolean
    follow_up_2_enviado?: boolean
    IA_responde?: boolean
}

interface Column {
    id: string
    title: string
    leads: Lead[]
}

export default function KanbanClient({ initialLeads }: { initialLeads: Lead[] }) {
    const [columns, setColumns] = useState<Record<string, Column>>({
        "Em andamento": {
            id: "Em andamento",
            title: "Em andamento",
            leads: [],
        },
        "Concluído": {
            id: "Concluído",
            title: "Concluído",
            leads: [],
        },
        "Desqualificado": {
            id: "Desqualificado",
            title: "Desqualificado",
            leads: [],
        },
    })
    const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({
        "Em andamento": 20,
        "Concluído": 20,
        "Desqualificado": 20,
    })
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    // Grab-to-scroll state
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [isDraggingScroll, setIsDraggingScroll] = useState(false)
    const [startX, setStartX] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)
    const [hasMoved, setHasMoved] = useState(false)

    const handleMouseDown = (e: React.MouseEvent) => {
        // Only trigger if clicking directly on the container or a non-interactive element
        const target = e.target as HTMLElement
        if (target.closest('button') || target.closest('a') || target.closest('[draggable="true"]')) {
            return
        }

        setIsDraggingScroll(true)
        setHasMoved(false)
        if (scrollContainerRef.current) {
            setStartX(e.pageX - scrollContainerRef.current.offsetLeft)
            setScrollLeft(scrollContainerRef.current.scrollLeft)
        }
    }

    const handleMouseLeave = () => {
        setIsDraggingScroll(false)
    }

    const handleMouseUp = () => {
        setIsDraggingScroll(false)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingScroll || !scrollContainerRef.current) return

        e.preventDefault()
        const x = e.pageX - scrollContainerRef.current.offsetLeft
        const walk = (x - startX) * 2 // Scroll speed

        if (Math.abs(x - startX) > 5) {
            setHasMoved(true)
        }

        scrollContainerRef.current.scrollLeft = scrollLeft - walk
    }

    const openDetails = (lead: Lead) => {
        setSelectedLead(lead)
        setIsSheetOpen(true)
    }

    const formatPhoneForWA = (phone: string) => {
        return phone.replace(/\D/g, '')
    }

    useEffect(() => {
        const newColumns = { ...columns }
        // Reset columns leads
        Object.keys(newColumns).forEach(key => {
            newColumns[key].leads = []
        })

        initialLeads.forEach((lead) => {
            const status = lead.Status || "Em andamento"
            if (newColumns[status]) {
                newColumns[status].leads.push(lead)
            } else {
                // Default to Em andamento if status doesn't match
                newColumns["Em andamento"].leads.push(lead)
            }
        })
        setColumns({ ...newColumns })
    }, [initialLeads])

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result

        if (!destination) return

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return
        }

        const start = columns[source.droppableId]
        const finish = columns[destination.droppableId]

        if (start === finish) {
            const newLeads = Array.from(start.leads)
            const [removed] = newLeads.splice(source.index, 1)
            newLeads.splice(destination.index, 0, removed)

            const newColumn = {
                ...start,
                leads: newLeads,
            }

            setColumns({
                ...columns,
                [newColumn.id]: newColumn,
            })
            return
        }

        // Moving from one list to another
        const startLeads = Array.from(start.leads)
        const [movedLead] = startLeads.splice(source.index, 1)
        const newStart = {
            ...start,
            leads: startLeads,
        }

        const finishLeads = Array.from(finish.leads)
        const updatedLead = { ...movedLead, Status: finish.id }
        finishLeads.splice(destination.index, 0, updatedLead)

        const newFinish = {
            ...finish,
            leads: finishLeads,
        }

        setColumns({
            ...columns,
            [newStart.id]: newStart,
            [newFinish.id]: newFinish,
        })

        // Update in Supabase
        try {
            const res = await updateLeadStatus(updatedLead.id, finish.id)
            if (!res.success) {
                toast.error("Erro ao atualizar status: " + res.error)
                // Rollback? Usually better to just show error and let user retry
            } else {
                toast.success(`Lead movido para ${finish.title}`)
            }
        } catch (err) {
            toast.error("Erro na conexão ao atualizar status")
        }
    }

    const loadMore = (columnId: string) => {
        setVisibleCounts(prev => ({
            ...prev,
            [columnId]: prev[columnId] + 20
        }))
    }

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        const observers: IntersectionObserver[] = []

        Object.keys(columns).forEach(columnId => {
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    loadMore(columnId)
                }
            }, { threshold: 0.1 })

            const target = document.querySelector(`#sentinel-${columnId.replace(/\s+/g, '-')}`)
            if (target) observer.observe(target)
            observers.push(observer)
        })

        return () => observers.forEach(o => o.disconnect())
    }, [columns])

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Concluído": return "bg-green-500";
            case "Desqualificado": return "bg-red-500";
            default: return "bg-blue-500";
        }
    }

    return (
        <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`flex h-full gap-4 lg:gap-6 overflow-x-auto pb-6 snap-x snap-mandatory md:snap-none px-4 pt-6 select-none ${isDraggingScroll ? "cursor-grabbing" : "cursor-grab"
                }`}
            style={{
                scrollSnapType: isDraggingScroll ? 'none' : undefined,
                userSelect: isDraggingScroll ? 'none' : 'auto'
            }}
        >
            <DragDropContext onDragEnd={onDragEnd}>
                {Object.values(columns).map((column) => (
                    <div
                        key={column.id}
                        className="flex flex-col w-[85vw] md:w-[380px] min-w-[85vw] md:min-w-[380px] snap-center shrink-0 h-full"
                    >
                        <div className={`flex flex-col gap-1 mb-3 p-3 rounded-t-xl bg-black/40 backdrop-blur-md border-b border-white/5 sticky top-0 z-10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]`}>
                            <div className="flex items-center justify-between">
                                <h3 className="font-light text-lg flex items-center gap-2 text-zinc-100/90 tracking-tight">
                                    {column.title}
                                </h3>
                                <Badge variant="outline" className="bg-white/5 text-zinc-400 border-white/5 font-mono text-xs">
                                    {column.leads.length}
                                </Badge>
                            </div>
                        </div>

                        <Droppable droppableId={column.id}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`flex-1 p-2 rounded-xl transition-colors min-h-[500px] ${snapshot.isDraggingOver ? "bg-zinc-900/50" : "bg-zinc-950/20"
                                        }`}
                                >
                                    {column.leads.slice(0, visibleCounts[column.id]).map((lead, index) => (
                                        <Draggable
                                            key={lead.id.toString()}
                                            draggableId={lead.id.toString()}
                                            index={index}
                                        >
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="mb-3"
                                                >
                                                    <Card
                                                        onClick={() => openDetails(lead)}
                                                        className={`group relative overflow-hidden p-4 border border-white/5 bg-black/40 backdrop-blur-md hover:bg-white/5 transition-all duration-300 cursor-pointer ${snapshot.isDragging ? "shadow-[0_0_30px_rgba(var(--primary),0.3)] border-primary/50 rotate-2 scale-105 z-50" : "shadow-sm hover:shadow-md hover:border-white/10"
                                                            }`}
                                                    >
                                                        <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${getStatusColor(column.title)} opacity-60 group-hover:opacity-100 transition-opacity`} />

                                                        <div className="pl-2 space-y-3">
                                                            <div className="flex items-start justify-between">
                                                                <span className="font-light text-zinc-100 group-hover:text-white line-clamp-1 flex items-center gap-2 text-base transition-colors">
                                                                    {lead.nome || "Lead sem nome"}
                                                                </span>
                                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Link
                                                                        href={`/chats?phone=${lead.telefone}`}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="p-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                                                                    >
                                                                        <MessageCircle className="w-4 h-4" />
                                                                    </Link>
                                                                    <div className="p-1.5 rounded-lg bg-white/5 text-zinc-400">
                                                                        <Info className="w-4 h-4" />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 text-sm text-zinc-500 font-light group-hover:text-zinc-400 transition-colors">
                                                                <Phone className="w-3.5 h-3.5 opacity-70" />
                                                                {lead.telefone}
                                                            </div>

                                                            <div className="flex items-center justify-between pt-3 border-t border-white/5 group-hover:border-white/10 transition-colors">
                                                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 group-hover:text-zinc-500 font-medium uppercase tracking-widest">
                                                                    <Calendar className="w-3 h-3 opacity-70" />
                                                                    {format(new Date(lead.created_at), "dd MMM • HH:mm", { locale: ptBR })}
                                                                </div>
                                                                {lead.IA_responde && (
                                                                    <div className="flex items-center gap-1 text-[10px] text-blue-500/80 font-semibold uppercase tracking-tighter">
                                                                        <Bot className="w-3 h-3" />
                                                                        AI
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </Card>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}

                                    {/* Infinite Scroll Sentinel */}
                                    {column.leads.length > visibleCounts[column.id] && (
                                        <div
                                            id={`sentinel-${column.id.replace(/\s+/g, '-')}`}
                                            className="h-20 flex items-center justify-center text-zinc-600 text-xs animate-pulse font-light"
                                        >
                                            Carregando mais leads...
                                        </div>
                                    )}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </DragDropContext>

            {/* Lead Details Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-[400px] sm:w-[540px] bg-black/95 border-l border-white/10 text-zinc-100 p-0 flex flex-col overflow-hidden">
                    {selectedLead && (
                        <>
                            <SheetHeader className="p-8 pb-6 border-b border-white/5 flex-shrink-0">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10`}>
                                        {selectedLead.nome?.[0] || "?"}
                                    </div>
                                    <div>
                                        <SheetTitle className="text-2xl font-light text-white tracking-tight">
                                            {selectedLead.nome || "Lead Sem Nome"}
                                        </SheetTitle>
                                        <div className="flex items-center gap-2 text-zinc-400 font-light mt-1">
                                            <Phone className="w-3.5 h-3.5" />
                                            {selectedLead.telefone}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        asChild
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl border-none shadow-lg shadow-green-900/20"
                                    >
                                        <Link href={`/chats?phone=${selectedLead.telefone}`}>
                                            <MessageCircle className="mr-2 w-4 h-4" />
                                            Atendimento
                                        </Link>
                                    </Button>
                                    <Badge className={`${getStatusColor(selectedLead.Status)} bg-opacity-20 text-white border-none py-2 px-4 rounded-xl text-xs uppercase tracking-widest font-semibold`}>
                                        {selectedLead.Status}
                                    </Badge>
                                </div>
                            </SheetHeader>

                            <ScrollArea className="flex-1 min-h-0 p-8 pt-6">
                                <div className="space-y-8 pb-10">
                                    {/* AI Status */}
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                                <Bot className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-zinc-200">Respostas de IA</div>
                                                <div className="text-xs text-zinc-500 font-light">Lead sendo atendido pelo robô</div>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={selectedLead.IA_responde}
                                            // onCheckedChange={...} 
                                            className="data-[state=checked]:bg-blue-600"
                                        />
                                    </div>

                                    {/* Conversation Summary */}
                                    <div className="space-y-3">
                                        <Label className="text-zinc-500 text-xs uppercase tracking-widest font-semibold">Resumo da Conversa</Label>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm font-light leading-relaxed text-zinc-300">
                                            {selectedLead["resumo da conversa"] || "Nenhum resumo disponível."}
                                        </div>
                                    </div>

                                    {/* Stages (t1-t12) */}
                                    <div className="space-y-4">
                                        <Label className="text-zinc-500 text-xs uppercase tracking-widest font-semibold">Etapas do Funil</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[...Array(12)].map((_, i) => {
                                                const key = `t${i + 1}` as keyof Lead
                                                const value = selectedLead[key as keyof Lead]
                                                return (
                                                    <div key={key} className={`p-3 rounded-xl border ${value ? 'border-primary/30 bg-primary/5 text-primary' : 'border-white/5 bg-white/5 text-zinc-500 opacity-50'} transition-all`}>
                                                        <div className="text-[10px] font-bold uppercase tracking-tighter mb-1">Passo {i + 1}</div>
                                                        <div className="text-xs truncate font-medium">{String(value || '-')}</div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Dates and Meta */}
                                    <div className="grid grid-cols-2 gap-4 pb-4">
                                        <div className="space-y-1">
                                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Criado em</div>
                                            <div className="text-sm font-light text-zinc-300">
                                                {format(new Date(selectedLead.created_at), "dd MMMM yyyy", { locale: ptBR })}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Horário</div>
                                            <div className="text-sm font-light text-zinc-300">
                                                {format(new Date(selectedLead.created_at), "HH:mm'h'", { locale: ptBR })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
