
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

interface StepConversionChartProps {
    data: {
        question: string;
        count: number;
        previousCount: number;
        percentage: number;
    }[];
}

export function StepConversionChart({ data }: StepConversionChartProps) {
    return (
        <Card className="col-span-3 border-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                    Taxa de Conversão p/ Etapa (%)
                </CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis
                                dataKey="question"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}%`}
                                domain={[0, 100]}
                            />
                            <Tooltip
                                cursor={{ fill: 'var(--muted)' }}
                                contentStyle={{
                                    backgroundColor: 'var(--popover)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    color: 'var(--popover-foreground)'
                                }}
                                formatter={(value: number, name: string, props: any) => {
                                    if (name === "Taxa") return [`${value}%`, "Conversão"];
                                    return [value, name];
                                }}
                                labelFormatter={(label) => `Etapa: ${label}`}
                            />
                            <Bar
                                dataKey="percentage"
                                name="Taxa"
                                radius={[4, 4, 0, 0]}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.percentage > 70 ? 'hsl(170, 100%, 50%)' : entry.percentage > 40 ? 'hsl(40, 100%, 50%)' : 'hsl(0, 100%, 60%)'}
                                        fillOpacity={0.8}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
