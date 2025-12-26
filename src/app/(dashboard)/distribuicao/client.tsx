'use client';

import { useState } from 'react';
import { Atendente, saveDistributionNumber, deleteDistributionNumber } from './actions';
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Search, Phone as PhoneIcon } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function DistributionClient({ initialData }: { initialData: Atendente[] }) {
    const [data, setData] = useState<Atendente[]>(initialData);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Atendente | null>(null);
    const [isLoading, setIsLoading] = useState(false);



    // Form state
    const [formData, setFormData] = useState({ name: '', phone: '', spreadsheetLink: '' });

    // Delete state
    const [itemToDelete, setItemToDelete] = useState<Atendente | null>(null);

    const filteredData = data.filter(item =>
        item.Nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.Telefone.includes(searchQuery)
    );

    function handleOpenDialog(item?: Atendente) {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.Nome,
                phone: item.Telefone,
                spreadsheetLink: item.link_planilha || ''
            });
        } else {
            setEditingItem(null);
            setFormData({ name: '', phone: '', spreadsheetLink: '' });
        }
        setIsDialogOpen(true);
    }

    async function handleSave() {
        if (!formData.name || !formData.phone) {
            toast.error("Preencha Nome e Telefone");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                id: editingItem?.id,
                Nome: formData.name,
                Telefone: formData.phone,
                link_planilha: formData.spreadsheetLink
            };

            const res = await saveDistributionNumber(payload);

            if (res.success) {
                toast.success(editingItem ? "Número atualizado!" : "Número adicionado com sucesso!");
                setIsDialogOpen(false);
                // Refresh logic would ideally re-fetch or optimistically update, 
                // but since these are server components we might need router.refresh() 
                // For now allow slight delay or simple reload if needed, but actions usually revalidatePath.
                // We'll optimistically update local state for speed.
                if (editingItem) {
                    setData(prev => prev.map(i => i.id === editingItem.id ? { ...i, Nome: formData.name, Telefone: formData.phone } : i));
                } else {
                    // Ideally we'd fetch the new ID, but here we'll just reload the page to be simple and safe
                    window.location.reload();
                }
            } else {
                toast.error("Erro ao salvar: " + res.error);
            }
        } catch (e) {
            console.error(e);
            toast.error("Erro interno ao salvar");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDelete() {
        if (!itemToDelete) return;

        try {
            const res = await deleteDistributionNumber(itemToDelete.id);
            if (res.success) {
                toast.success("Número removido!");
                setData(prev => prev.filter(i => i.id !== itemToDelete.id));
            } else {
                toast.error("Erro ao remover: " + res.error);
            }
        } catch (e) {
            toast.error("Erro interno ao remover");
        } finally {
            setItemToDelete(null);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome ou telefone..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Número
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>WhatsApp</TableHead>
                            <TableHead className="text-center">Leads Hoje</TableHead>
                            <TableHead className="text-center">Leads Total</TableHead>
                            <TableHead>Planilha</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    Nenhum número cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback className="text-xs">
                                                {item.Nome.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium">{item.Nome}</TableCell>
                                    <TableCell>{item.Telefone}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-800/30 dark:text-blue-400">
                                            {item["Leads hoje"] || 0}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                            {item["Leads total"] || 0}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {item.link_planilha ? (
                                            <a
                                                href={item.link_planilha}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-500 hover:underline truncate max-w-[150px] block"
                                                title={item.link_planilha}
                                            >
                                                Abrir Planilha
                                            </a>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                                                <Pencil className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setItemToDelete(item)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit/Add Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Editar Número' : 'Adicionar Novo Número'}</DialogTitle>
                        <DialogDescription>
                            Configure quem receberá os resumos dos leads.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome do Recebedor</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Dr. Fulano"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">WhatsApp (com DDD)</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Ex: 5511999999999"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="spreadsheet">Link da Planilha</Label>
                            <Input
                                id="spreadsheet"
                                value={formData.spreadsheetLink}
                                onChange={(e) => setFormData({ ...formData, spreadsheetLink: e.target.value })}
                                placeholder="https://docs.google.com/..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Isso removerá <b>{itemToDelete?.Nome}</b> da lista de distribuição. Essa ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
