"use client";

import { useEffect, useState, useTransition } from "react";
import { getUserProfile, updateUserProfile, getInstanceStatus } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfileData {
    "Escritório": string;
    "Nome do advogado": string;
    "Endereço": string;
    "Tempo até alguém entrar em contato": string;
    "link da planilha": string;
    "token_uazapi": string;
    "telefone": string;
    [key: string]: any;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [instanceStatus, setInstanceStatus] = useState<{ state: string, error?: string } | null>(null);
    const [loadingStatus, setLoadingStatus] = useState(false);

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

    const checkStatus = async () => {
        setLoadingStatus(true);
        try {
            const status = await getInstanceStatus();
            setInstanceStatus(status);
        } catch (error) {
            console.error("Status check failed", error);
            setInstanceStatus({ state: 'error', error: 'Falha ao verificar' });
        } finally {
            setLoadingStatus(false);
        }
    };

    useEffect(() => {
        loadProfile();
        checkStatus();
    }, []);

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            const result = await updateUserProfile(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Perfil atualizado com sucesso!");
                // Reload profile to get fresh data confirms update
                loadProfile();
            }
        });
    };

    const getStatusBadge = () => {
        if (loadingStatus) return <Badge variant="outline" className="animate-pulse">Verificando...</Badge>;
        if (!instanceStatus) return <Badge variant="outline">Desconhecido</Badge>;

        const state = instanceStatus.state.toLowerCase();

        if (state === 'open' || state === 'connected') {
            return (
                <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/50 gap-1">
                    <Wifi className="h-3 w-3" />
                    Conectado - {state}
                </Badge>
            );
        }

        if (state === 'connecting') {
            return (
                <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/50 gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Conectando...
                </Badge>
            );
        }

        return (
            <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/50 gap-1">
                <WifiOff className="h-3 w-3" />
                Desconectado ({state})
            </Badge>
        );
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
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Meu Perfil
                </h1>

                {/* Status Indicator */}
                <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm p-3 rounded-xl border border-border/50 shadow-sm">
                    <span className="text-xs font-medium text-muted-foreground mr-2">Status Uazapi:</span>
                    {getStatusBadge()}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1 text-muted-foreground hover:text-white"
                        onClick={checkStatus}
                        title="Atualizar Status"
                        disabled={loadingStatus}
                    >
                        <RefreshCw className={`h-3 w-3 ${loadingStatus ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <Card className="border-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Informações do Usuário</CardTitle>
                    <CardDescription>Gerencie suas informações comerciais e de contato.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-6">
                        <div className="flex gap-4 items-start">
                            <div className="grid gap-2 flex-1">
                                <Label htmlFor="telefone">Telefone (Login)</Label>
                                <Input
                                    id="telefone"
                                    name="telefone"
                                    defaultValue={profile.telefone || ''}
                                    placeholder="55..."
                                    className="bg-background/50"
                                />
                                <p className="text-xs text-muted-foreground">Este telefone é usado para login e sincronização.</p>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="escritorio">Nome do Escritório</Label>
                            <Input
                                id="escritorio"
                                name="escritorio"
                                defaultValue={profile["Escritório"] || ''}
                                placeholder="Ex: Silva & Souza Advogados"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="nome_advogado">Nome do Advogado Principal</Label>
                            <Input
                                id="nome_advogado"
                                name="nome_advogado"
                                defaultValue={profile["Nome do advogado"] || ''}
                                placeholder="Nome completo"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="endereco">Endereço</Label>
                            <Input
                                id="endereco"
                                name="endereco"
                                defaultValue={profile["Endereço"] || ''}
                                placeholder="Endereço comercial completo"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="tempo_contato">Tempo de Contato</Label>
                            <Input
                                id="tempo_contato"
                                name="tempo_contato"
                                defaultValue={profile["Tempo até alguém entrar em contato"] || ''}
                                placeholder="Ex: 24 horas"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="token_uazapi">Token Uazapi</Label>
                            <Input
                                id="token_uazapi"
                                name="token_uazapi"
                                defaultValue={profile["token_uazapi"] || ''}
                                placeholder="Token da API"
                                type="password"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="link_planilha">Link da Planilha</Label>
                            <Input
                                id="link_planilha"
                                name="link_planilha"
                                defaultValue={profile["link da planilha"] || ''}
                                placeholder="URL da planilha Google Sheets"
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
    );
}
