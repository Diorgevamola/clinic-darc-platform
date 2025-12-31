
'use client';

import { Lead, LeadCard } from "./LeadCard";
import { Skeleton } from "@/components/ui/skeleton";

interface LeadListProps {
    leads: Lead[];
    loading: boolean;
}

export function LeadList({ leads, loading }: LeadListProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-[150px] w-full rounded-xl" />
                <Skeleton className="h-[150px] w-full rounded-xl" />
                <Skeleton className="h-[150px] w-full rounded-xl" />
            </div>
        );
    }

    if (leads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-dashed border-border/60 bg-muted/5">
                <p className="text-muted-foreground text-center">
                    Nenhum lead encontrado para os filtros selecionados.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-medium tracking-tight text-foreground ml-1">
                Lista de Leads
            </h2>
            <div className="grid gap-4">
                {leads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                ))}
            </div>
        </div>
    );
}
