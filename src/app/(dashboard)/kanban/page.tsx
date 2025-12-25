import { Suspense } from "react"
import { getKanbanLeads } from "./actions"
import KanbanClient from "./client"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"

export const metadata = {
    title: "Kanban | AllService AI",
    description: "Gerencie seus leads de forma visual",
}

export default async function KanbanPage() {
    const leads = await getKanbanLeads()

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <DashboardHeader />

            <main className="flex-1 overflow-x-auto">
                <Suspense fallback={<div className="text-white">Carregando painel...</div>}>
                    <KanbanClient initialLeads={leads} />
                </Suspense>
            </main>
        </div>
    )
}
