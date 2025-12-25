'use client';

import { Sidebar } from "@/components/layout/Sidebar";
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isChatsPage = pathname === '/chats';
    const isKanbanPage = pathname === '/kanban';

    // Chats needs overflow-hidden to handle its own scrolling
    // Kanban needs p-0 but allows main overflow (for now, or we can move scrollbars inner)
    const isNoPadding = isChatsPage || isKanbanPage;

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className={`flex-1 ${isNoPadding ? 'p-0' : 'p-8'} ${isChatsPage ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                {children}
            </main>
        </div>
    );
}
