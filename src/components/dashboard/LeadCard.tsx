'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Calendar, Shield, Flame, Thermometer, Snowflake } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface Lead {
    id: number;
    nome: string;
    telefone: string;
    status: string;
    created_at: string;
    area?: string;
    urgencia?: 'quente' | 'morno' | 'frio';
    resumo?: string;
}

interface LeadCardProps {
    lead: Lead;
}

export function LeadCard({ lead }: LeadCardProps) {
    const getUrgencyIcon = (urgencia?: string) => {
        switch (urgencia) {
            case 'quente': return <Flame className="h-4 w-4 text-orange-500" />;
            case 'morno': return <Thermometer className="h-4 w-4 text-yellow-500" />;
            case 'frio': return <Snowflake className="h-4 w-4 text-blue-300" />;
            default: return <Thermometer className="h-4 w-4 text-gray-400" />;
        }
    };

    const getUrgencyBadge = (urgencia?: string) => {
        switch (urgencia) {
            case 'quente': return <Badge variant="outline" className="border-orange-500/50 text-orange-500 bg-orange-500/10 font-medium">Quente</Badge>;
            case 'morno': return <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10 font-medium">Morno</Badge>;
            case 'frio': return <Badge variant="outline" className="border-blue-500/50 text-blue-500 bg-blue-500/10 font-medium">Frio</Badge>;
            default: return <Badge variant="outline" className="text-gray-400 font-medium">N/A</Badge>;
        }
    };

    const getStatusBadge = (status: string) => {
        const s = status?.trim() || "Novo";
        switch (s) {
            case "Concluído":
            case "Qualificado":
                return <Badge className="bg-green-500/80 hover:bg-green-600 text-white border-none font-medium">Convertido</Badge>;
            case "Em andamento":
                return <Badge className="bg-blue-500/80 hover:bg-blue-600 text-white border-none font-medium">Em contato</Badge>;
            case "Desqualificado":
                return <Badge variant="destructive" className="border-none font-medium">Perdido</Badge>;
            default:
                return <Badge variant="secondary" className="bg-slate-700 text-slate-200 border-none font-medium">Novo</Badge>;
        }
    };

    const whatsappUrl = `https://wa.me/${lead.telefone.replace(/\D/g, '')}`;

    return (
        <Card className="bg-card/40 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 group shadow-sm">
            <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
                    <div className="flex-1 space-y-3 w-full">
                        <div className="flex items-center justify-between md:justify-start md:gap-4">
                            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                {lead.nome || "Lead sem nome"}
                            </h3>
                            <div className="flex items-center gap-2">
                                {getUrgencyIcon(lead.urgencia)}
                                {getUrgencyBadge(lead.urgencia)}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground font-medium">
                            <div className="flex items-center gap-1">
                                <Shield className="h-3.5 w-3.5" />
                                <span>{lead.area || "Geral"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{lead.created_at ? format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"}</span>
                            </div>
                            <div className="md:ml-2">
                                {getStatusBadge(lead.status)}
                            </div>
                        </div>

                        {lead.resumo && (
                            <div className="bg-muted/30 p-3 rounded-lg border border-border/70">
                                <p className="text-sm font-medium text-muted-foreground/90 line-clamp-2 italic leading-relaxed">
                                    "{lead.resumo}"
                                </p>
                            </div>
                        )}
                        {!lead.resumo && (
                            <div className="bg-muted/20 p-3 rounded-lg border border-dashed border-border/60">
                                <p className="text-xs font-medium text-muted-foreground/80 italic">
                                    Resumo da conversa sendo gerado pela IA...
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto pt-2 md:pt-0">
                        <Button
                            asChild
                            variant="outline"
                            className="flex-1 md:flex-none bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-500 gap-2"
                        >
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="h-4 w-4" />
                                <span className="md:hidden lg:inline">WhatsApp</span>
                            </a>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
