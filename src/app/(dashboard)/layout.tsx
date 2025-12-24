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

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className={`flex-1 ${isChatsPage ? 'p-0 overflow-hidden' : 'p-8 overflow-y-auto'}`}>
                {children}
            </main>
        </div>
    );
}
