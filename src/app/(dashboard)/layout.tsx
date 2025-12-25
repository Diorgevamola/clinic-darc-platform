'use client';

import { useState, useEffect } from 'react';
import { Sidebar, MobileHeader } from "@/components/layout/Sidebar";
import { usePathname } from 'next/navigation';
import { getUserProfile } from "@/app/(dashboard)/perfil/actions";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [officeName, setOfficeName] = useState("Clinic Darc AI");

    const isChatsPage = pathname === '/chats';
    const isKanbanPage = pathname === '/kanban';

    // Chats needs overflow-hidden to handle its own scrolling
    // Kanban needs p-0 but allows main overflow (for now, or we can move scrollbars inner)
    const isNoPadding = isChatsPage || isKanbanPage;

    useEffect(() => {
        async function loadProfile() {
            try {
                const profile = await getUserProfile();
                if (profile && profile["Escritório"]) {
                    setOfficeName(profile["Escritório"]);
                }
            } catch (error) {
                console.error("Erro ao carregar nome do escritório:", error);
            }
        }
        loadProfile();
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Mobile Header */}
            <MobileHeader
                onMenuClick={() => setIsMobileMenuOpen(true)}
                officeName={officeName}
            />

            {/* Desktop Sidebar - hidden on mobile */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    {/* Sidebar */}
                    <div className="absolute left-0 top-0 h-full w-[280px] animate-in slide-in-from-left duration-300">
                        <Sidebar
                            isMobileOpen={isMobileMenuOpen}
                            onMobileClose={() => setIsMobileMenuOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className={`flex-1 ${isNoPadding ? 'p-0' : 'p-4 md:p-8'} ${isChatsPage ? 'overflow-hidden' : 'overflow-y-auto'} pt-14 md:pt-0`}>
                {children}
            </main>
        </div>
    );
}
