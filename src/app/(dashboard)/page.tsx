
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
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
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

        // Logic similar to Leads page
        if (dateRange?.from) {
          start = startOfDay(dateRange.from).toISOString();
        }
        if (dateRange?.to) {
          end = endOfDay(dateRange.to).toISOString();
        }
        // If start is set but no end, assume single day range (end of that same day)
        if (start && !end) {
          end = endOfDay(dateRange!.from!).toISOString();
        }

        // If no range selected at all, maybe default to "today" or "last 30 days"?
        // The previous default was 'today'. 
        // Let's default to today if nothing selected for consistency with initial state empty?
        // Or if undefined, fetchDashboardData handles fallback (e.g., all time or custom).
        // Let's assume start/end undefined means "All time" potentially, or fetchDashboardData has defaults.
        // Looking at fetchDashboardData: if params are missing, it queries without date filter (all time).
        // BUT getLeadsOverTimeData defaults to 30 days.
        // Let's explicitly set a default "Today" if dateRange is purely empty on first load?
        // Actually, useState initialized with empty. Let's strictly follow the DatePicker selection. 
        // If undefined, we pass undefined.

        // HOWEVER, for the Charts component, we usually want a default view. 
        // Let's set the initial state to 'Today' to match previous behavior?
        // const [range, setRange] = useState<TimeRange>('today');
        // Let's initialized dateRange with Today.

        const stats = await fetchDashboardData(start, end, selectedArea);
        setData(stats);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [dateRange, selectedArea]);

  // Set default date range to Today on mount if needed, or keep empty to show "Selecione uma data"
  useEffect(() => {
    // Set default to today
    setDateRange({
      from: new Date(),
      to: new Date()
    });
  }, []);

  // Deriving ISO strings for the Chart component
  // We need to pass valid strings. If undefined, the chart action handles defaults (30 days).
  // But we likely want the chart to match the dashboard stats date range.
  // So we pass the same calculated start/end.

  const getChartDates = () => {
    let start: string | undefined;
    let end: string | undefined;

    if (dateRange?.from) {
      start = startOfDay(dateRange.from).toISOString();
    }
    if (dateRange?.to) {
      end = endOfDay(dateRange.to).toISOString();
    }
    if (start && !end) {
      end = endOfDay(dateRange!.from!).toISOString();
    }
    return { start, end };
  };

  const { start: chartStart, end: chartEnd } = getChartDates();

  return (
    <div className="flex-1 space-y-4">
      <DashboardHeader>
        <div className="flex flex-wrap items-center gap-3 md:gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm font-medium text-muted-foreground whitespace-nowrap">Script:</span>
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className="w-[140px] md:w-[180px] bg-card/50 backdrop-blur-sm border-border text-sm">
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

          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
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
              <LeadsOverTimeChart startDate={chartStart} endDate={chartEnd} />
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

