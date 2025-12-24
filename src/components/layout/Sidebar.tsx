"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, ChevronLeft, ChevronRight, LogOut, Users, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions";
import { motion, AnimatePresence } from "motion/react";

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
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
        title: "Perfil",
        href: "/perfil",
        icon: User,
    },
];

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    const toggleSidebar = () => setCollapsed(!collapsed);

    return (
        <motion.div
            initial={{ width: 240 }}
            animate={{ width: collapsed ? 80 : 240 }}
            className="relative flex h-screen flex-col border-r bg-card text-card-foreground transition-all duration-300"
        >
            <div className="flex h-16 items-center justify-between px-4">
                {!collapsed && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-lg font-bold truncate bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                    >
                        AllService AI
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

            <nav className="flex-1 space-y-2 p-2">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
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
