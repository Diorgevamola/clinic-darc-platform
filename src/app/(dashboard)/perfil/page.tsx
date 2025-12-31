"use client";

import { useEffect, useState, useTransition } from "react";
import { getUserProfile, updateUserProfile } from "./actions"; // Removed getInstanceStatus
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProfileData {
    id: number;
    nome: string;
    telefone: string;
    link_planilha?: string;
    DDD?: number;
    Beneficio_1?: string;
    DDD_negativo?: number;
    Beneficio_1_negativo?: string;
    "Leads hoje"?: number; // Note: spaces in column name in DB, mapped here
    "Leads total"?: number;
    "Limit. p/ dia"?: number;
    [key: string]: any;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    // Map DB columns with spaces/dots to simpler keys if needed, 
    // or access them via bracket notation. 
    // The select('*') returns them as is.

    const loadProfile = async () => {
        try {
            const data = await getUserProfile();
            setProfile(data);
        } catch (error) {
            toast.error("Erro ao carregar perfil");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            const result = await updateUserProfile(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Perfil atualizado com sucesso!");
                loadProfile();
            }
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!profile) {
        return <div className="text-center text-red-500">Erro ao carregar dados.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-light tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {profile.nome || "Meu Perfil"}
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Leads Hoje</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{profile["Leads hoje"] || 0}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total de Leads</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{profile["Leads total"] || 0}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Limite Diário</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{profile["Limit. p/ dia"] || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info (Editable) */}
                <div className="md:col-span-2">
                    <Card className="border-border bg-card/50 backdrop-blur-sm h-full">
                        <CardHeader>
                            <CardTitle>Informações da Empresa</CardTitle>
                            <CardDescription>Edite as informações básicas da sua conta.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form action={handleSubmit} className="space-y-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="nome">Nome</Label>
                                    <Input
                                        id="nome"
                                        name="nome"
                                        defaultValue={profile.nome || ''}
                                        placeholder="Nome da empresa"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="link_planilha">Link da Planilha</Label>
                                    <Input
                                        id="link_planilha"
                                        name="link_planilha"
                                        defaultValue={profile.link_planilha || ''}
                                        placeholder="https://docs.google.com/..."
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isPending ? "Salvando..." : "Salvar Alterações"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Read-Only Settings */}
                <div className="md:col-span-1">
                    <Card className="border-border bg-card/50 backdrop-blur-sm h-full">
                        <CardHeader>
                            <CardTitle>Configurações</CardTitle>
                            <CardDescription>Dados de sistema (somente leitura).</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-1">
                                <Label className="text-muted-foreground text-xs">Telefone (Login)</Label>
                                <div className="font-medium">{profile.telefone}</div>
                            </div>
                            <div className="grid gap-1">
                                <Label className="text-muted-foreground text-xs">ID</Label>
                                <div className="font-mono text-sm">{profile.id}</div>
                            </div>
                            <div className="grid gap-1">
                                <Label className="text-muted-foreground text-xs">Benefício Principal (Script)</Label>
                                <div className="font-medium truncate" title={profile.Beneficio_1}>{profile.Beneficio_1 || '-'}</div>
                            </div>
                            <div className="grid gap-1">
                                <Label className="text-muted-foreground text-xs">DDD</Label>
                                <div className="font-medium">{profile.DDD || '-'}</div>
                            </div>
                            <div className="grid gap-1">
                                <Label className="text-muted-foreground text-xs">Leads Máximos</Label>
                                <div className="font-medium">{profile.Leads_max || '-'}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
