
'use client';

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeRange } from "@/lib/api";
import Image from 'next/image';

interface DashboardHeaderProps {
    children?: React.ReactNode;
}

export function DashboardHeader({ children }: DashboardHeaderProps) {
    return (
        <div className="flex items-center justify-end w-full">
            <div className="flex items-center gap-4">
                {children}
            </div>
        </div>
    );
}
