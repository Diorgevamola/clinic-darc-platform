"use client";

import { useState, useEffect } from 'react';
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { fetchDashboardData, getAvailableScripts, DashboardStats } from "@/lib/api";
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
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

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

  // Set default date range to last 7 days on mount
  useEffect(() => {
    const end = new Date();
    const start = subDays(end, 7);
    setDateRange({
      from: start,
      to: end
    });
  }, []);


  return (
    <div className="flex-1 space-y-4">
      <DashboardHeader>
        <div className="flex flex-wrap items-center gap-3 md:gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm font-semibold text-muted-foreground whitespace-nowrap">Script:</span>
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className="w-[140px] md:w-[180px] bg-card/50 backdrop-blur-sm border-border/80 text-sm shadow-sm">
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
        <div className="space-y-8">
          <SummaryCards
            stats={{
              totalMonth: data.totalMonth,
              totalToday: data.totalToday,
              total: data.total
            }}
          />
        </div>
      ) : (
        <div className="text-red-500 text-center py-10">Erro ao carregar os dados da dashboard.</div>
      )}
    </div>
  );
}
