import React, { useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SavePresentationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => Promise<void>;
    defaultName?: string;
}

export const SavePresentationDialog: React.FC<SavePresentationDialogProps> = ({
    isOpen, onClose, onSave, defaultName
}) => {
    const [name, setName] = useState(defaultName || '');
    const [isSaving, setIsSaving] = useState(false);

    // Update name when dialog opens or default changes
    React.useEffect(() => {
        if (isOpen) {
            setName(defaultName || `Apresentação ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`);
        }
    }, [isOpen, defaultName]);

    const handleSave = async () => {
        if (!name.trim()) return;

        try {
            setIsSaving(true);
            await onSave(name);
            onClose();
        } catch (error) {
            safeLog.error('Erro ao salvar apresentação:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle>Salvar Apresentação</DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="pres-name">Nome da Apresentação</Label>
                        <Input
                            id="pres-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Resultado Semanal SP"
                            autoFocus
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
