
"use client";

import { useState, useEffect } from 'react';
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { StepConversionChart } from "@/components/dashboard/StepConversionChart";
import { LeadsOverTimeChart } from '@/components/dashboard/LeadsOverTimeChart';
import { fetchDashboardData, getAvailableScripts, TimeRange, DashboardStats } from "@/lib/api";
import { startOfDay, endOfDay, subDays } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  const [range, setRange] = useState<TimeRange>('today');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [scripts, setScripts] = useState<string[]>([]);
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScripts() {
      try {
        const data = await getAvailableScripts();
        setScripts(data);
      } catch (error) {
        console.error("Erro ao carregar scripts:", error);
      }
    }
    fetchScripts();
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let start: string | undefined;
        let end: string | undefined;
        const now = new Date();

        switch (range) {
          case 'today':
            start = startOfDay(now).toISOString();
            break;
          case 'yesterday':
            start = startOfDay(subDays(now, 1)).toISOString();
            end = endOfDay(subDays(now, 1)).toISOString();
            break;
          case '7days':
            start = startOfDay(subDays(now, 7)).toISOString();
            break;
          case '30days':
            start = startOfDay(subDays(now, 30)).toISOString();
            break;
        }

        const stats = await fetchDashboardData(start, end, selectedArea);
        setData(stats);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [range, selectedArea]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <DashboardHeader>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Script:</span>
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className="w-[180px] bg-card/50 backdrop-blur-sm border-border">
                <SelectValue placeholder="Todos os Scripts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Scripts</SelectItem>
                {scripts.map((script) => (
                  <SelectItem key={script} value={script}>
                    {script.charAt(0).toUpperCase() + script.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={range} onValueChange={(v) => setRange(v as TimeRange)}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="today">Hoje</TabsTrigger>
              <TabsTrigger value="yesterday">Ontem</TabsTrigger>
              <TabsTrigger value="7days">7 Dias</TabsTrigger>
              <TabsTrigger value="30days">30 Dias</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </DashboardHeader>

      {loading ? (
        <div className="flex h-[200px] items-center justify-center">
          <div className="text-muted-foreground">Carregando dados...</div>
        </div>
      ) : data ? (
        <div className="space-y-4">
          <StatsCards stats={data} />
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-1 md:col-span-2 lg:col-span-4">
              <LeadsOverTimeChart />
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <FunnelChart data={data.funnel} />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-1 md:col-span-2 lg:col-span-7">
              <StepConversionChart data={data.stepConversion} />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-red-500">Erro ao carregar dados.</div>
      )}
    </div>
  );
}

