
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, ChevronLeft, ChevronRight, LogOut, Users, MessageSquare, Layout } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions";
import { getUserProfile } from "@/app/(dashboard)/perfil/actions";
import { motion, AnimatePresence } from "motion/react";

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Kanban",
        href: "/kanban",
        icon: Layout,
    },
    {
        title: "Leads",
        href: "/leads",
        icon: Users,
    },
    {
        title: "Chats",
        href: "/chats",
        icon: MessageSquare,
    },
    {
        title: "Distribuição",
        href: "/distribuicao",
        icon: Users,
    },

    {
        title: "Perfil",
        href: "/perfil",
        icon: User,
    },
];

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [officeName, setOfficeName] = useState<string>("AllService AI");
    const pathname = usePathname();

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

    const toggleSidebar = () => setCollapsed(!collapsed);

    return (
        <motion.div
            initial={{ width: 240 }}
            animate={{ width: collapsed ? 100 : 280 }}
            className="relative flex h-screen flex-col border-r border-white/5 bg-black/60 backdrop-blur-xl text-zinc-100 transition-all duration-300"
        >
            <div className="flex h-16 items-center justify-between px-4">
                {!collapsed && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-lg font-bold truncate bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                    >
                        {officeName}
                    </motion.span>
                )}
                {collapsed && (
                    <div className="mx-auto h-8 w-8 rounded-full bg-gradient-to-r from-primary to-secondary" />
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -right-4 top-6 h-8 w-8 rounded-full border bg-background shadow-md"
                    onClick={toggleSidebar}
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            <nav className="flex-1 space-y-4 px-4 py-6">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-light tracking-wide transition-all hover:bg-white/5 hover:text-white",
                                isActive ? "bg-white/5 text-white shadow-[0_0_20px_rgba(255,255,255,0.02)] border border-white/5" : "text-zinc-400",
                                collapsed && "justify-center px-2"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {!collapsed && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                >
                                    {item.title}
                                </motion.span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t">
                <form action={logoutAction}>
                    <Button
                        variant="ghost"
                        className={cn("w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10", collapsed && "justify-center px-0")}
                        type="submit"
                    >
                        <LogOut className="h-5 w-5" />
                        {!collapsed && <span className="ml-2">Sair</span>}
                    </Button>
                </form>
            </div>
        </motion.div>
    );
}
