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
            const res = await updateLeadStatus(updatedLead.id as any, finish.id)
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
                        <div className={`flex flex-col gap-1 mb-3 p-3 rounded-t-xl bg-muted/50 backdrop-blur-md border-b border-border sticky top-0 z-10 shadow-sm`}>
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium text-lg flex items-center gap-2 text-foreground tracking-tight">
                                    {column.title}
                                </h3>
                                <Badge variant="outline" className="bg-background text-muted-foreground border-border font-mono text-xs">
                                    {column.leads.length}
                                </Badge>
                            </div>
                        </div>

                        <Droppable droppableId={column.id}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`flex-1 p-2 rounded-xl transition-colors min-h-[500px] ${snapshot.isDraggingOver ? "bg-muted/80" : "bg-muted/30"
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
                                                        className={`group relative overflow-hidden p-4 border border-border bg-card hover:bg-card/80 transition-all duration-300 cursor-pointer ${snapshot.isDragging ? "shadow-lg border-primary/50 rotate-2 scale-105 z-50" : "shadow-sm hover:shadow-md hover:border-primary/20"
                                                            }`}
                                                    >
                                                        <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${getStatusColor(column.title)} opacity-60 group-hover:opacity-100 transition-opacity`} />

                                                        <div className="pl-2 space-y-3">
                                                            <div className="flex items-start justify-between">
                                                                <span className="font-medium text-foreground group-hover:text-primary line-clamp-1 flex items-center gap-2 text-base transition-colors">
                                                                    {lead.nome || "Lead sem nome"}
                                                                </span>
                                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <div className="p-1.5 rounded-lg bg-muted text-muted-foreground">
                                                                        <Info className="w-4 h-4" />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-normal group-hover:text-foreground transition-colors">
                                                                <Phone className="w-3.5 h-3.5 opacity-70" />
                                                                {lead.telefone}
                                                            </div>

                                                            <div className="flex items-center justify-between pt-3 border-t border-border group-hover:border-primary/10 transition-colors">
                                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground group-hover:text-foreground font-medium uppercase tracking-widest">
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
                <SheetContent className="w-[400px] sm:w-[540px] bg-background border-l border-border text-foreground p-0 flex flex-col overflow-hidden">
                    {selectedLead && (
                        <>
                            <SheetHeader className="p-8 pb-6 border-b border-border flex-shrink-0">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-primary-foreground text-xl font-medium bg-primary shadow-sm`}>
                                        {selectedLead.nome?.[0] || "?"}
                                    </div>
                                    <div>
                                        <SheetTitle className="text-2xl font-semibold text-foreground tracking-tight">
                                            {selectedLead.nome || "Lead Sem Nome"}
                                        </SheetTitle>
                                        <div className="flex items-center gap-2 text-muted-foreground font-normal mt-1">
                                            <Phone className="w-3.5 h-3.5" />
                                            {selectedLead.telefone}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Badge className={`${getStatusColor(selectedLead.Status)} bg-opacity-10 text-foreground border border-border py-2 px-4 rounded-xl text-xs uppercase tracking-widest font-bold`}>
                                        {selectedLead.Status}
                                    </Badge>
                                </div>
                            </SheetHeader>

                            <ScrollArea className="flex-1 min-h-0 p-8 pt-6">
                                <div className="space-y-8 pb-10">
                                    {/* AI Status */}
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                                                <Bot className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-foreground">Respostas de IA</div>
                                                <div className="text-xs text-muted-foreground font-normal">Lead sendo atendido pelo robô</div>
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
                                        <Label className="text-muted-foreground text-xs uppercase tracking-widest font-bold">Resumo da Conversa</Label>
                                        <div className="p-4 rounded-2xl bg-muted/30 border border-border text-sm font-normal leading-relaxed text-foreground">
                                            {selectedLead["resumo da conversa"] || "Nenhum resumo disponível."}
                                        </div>
                                    </div>

                                    {/* Stages (t1-t12) */}
                                    <div className="space-y-4">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-widest font-bold">Etapas do Funil</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[...Array(12)].map((_, i) => {
                                                const key = `t${i + 1}` as keyof Lead
                                                const value = selectedLead[key as keyof Lead]
                                                return (
                                                    <div key={key} className={`p-3 rounded-xl border ${value ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border bg-muted/20 text-muted-foreground opacity-60'} transition-all`}>
                                                        <div className="text-[10px] font-bold uppercase tracking-tighter mb-1">Passo {i + 1}</div>
                                                        <div className="text-xs truncate font-semibold">{String(value || '-')}</div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Dates and Meta */}
                                    <div className="grid grid-cols-2 gap-4 pb-4">
                                        <div className="space-y-1">
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Criado em</div>
                                            <div className="text-sm font-normal text-foreground">
                                                {format(new Date(selectedLead.created_at), "dd MMMM yyyy", { locale: ptBR })}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Horário</div>
                                            <div className="text-sm font-normal text-foreground">
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
