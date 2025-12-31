
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, Percent, CreditCard } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

interface SummaryCardsProps {
    stats: {
        totalMonth: number;
        totalToday: number;
        total: number;
    };
}

export function SummaryCards({ stats }: SummaryCardsProps) {
    const cards = [
        {
            title: "Leads recebidos (mês)",
            value: stats.totalMonth,
            icon: Users,
            color: "text-blue-400/80",
            description: "Total de leads no mês atual"
        },
        {
            title: "Leads recebidos (hoje)",
            value: stats.totalToday,
            icon: CheckCircle,
            color: "text-green-400/80",
            description: "Leads recebidos hoje"
        },
        {
            title: "Leads no Período",
            value: stats.total,
            icon: Percent,
            color: "text-purple-400/80",
            description: "Total de leads no filtro selecionado"
        }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => (
                <div key={index} className="relative rounded-xl border border-border/80 p-0.5 shadow-sm">
                    <GlowingEffect
                        spread={40}
                        glow={true}
                        disabled={false}
                        proximity={64}
                        inactiveZone={0.01}
                        borderWidth={3}
                    />
                    <Card className="relative h-full bg-card/60 backdrop-blur-md shadow-sm border border-border/60">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground/90">
                                {card.title}
                            </CardTitle>
                            <card.icon className={`h-4 w-4 ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-semibold tracking-tight text-foreground">{card.value}</div>
                            <p className="text-xs font-medium text-muted-foreground/90 mt-1">
                                {card.description}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            ))}
        </div>
    );
}
