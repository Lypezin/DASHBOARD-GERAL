import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Calendar, MapPin, Play, RefreshCw } from 'lucide-react';
import { SavedPresentation } from '@/hooks/apresentacao/useSavedPresentations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PresentationManagerProps {
    isOpen: boolean;
    onClose: () => void;
    presentations: SavedPresentation[];
    onLoad: (presentation: SavedPresentation) => void;
    onDelete: (id: string) => void;
    isLoading: boolean;
    error: string | null;
    onRetry: () => void;
}

export const PresentationManager: React.FC<PresentationManagerProps> = ({
    isOpen, onClose, presentations, onLoad, onDelete, isLoading, error, onRetry
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle>Apresentações Salvas</DialogTitle>
                </DialogHeader>

                <div className="mt-4">
                    {error && (
                        <div role="alert" className="mb-4 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
                            <span>{error}</span>
                            <Button type="button" size="sm" variant="outline" onClick={onRetry} disabled={isLoading} className="shrink-0 gap-2">
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                Tentar novamente
                            </Button>
                        </div>
                    )}
                    {isLoading && presentations.length === 0 ? (
                        <div className="flex justify-center p-8 text-slate-500">Carregando...</div>
                    ) : presentations.length === 0 ? (
                        error ? null : <div className="text-center p-8 text-slate-500">Nenhuma apresentação salva encontrada.</div>
                    ) : (
                        <ScrollArea className="h-[400px] w-full pr-4">
                            <div className="space-y-3">
                                {presentations.map((pres) => (
                                    <div key={pres.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-slate-900 dark:text-slate-100">{pres.name}</h3>
                                            <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(pres.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                                </span>
                                                {pres.filters?.praca && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {pres.filters.praca}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    Slides: {pres.slides?.length || 0}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onLoad(pres)}
                                                className="gap-2"
                                            >
                                                <Play className="w-3 h-3" />
                                                Abrir
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => {
                                                    if (confirm('Tem certeza que deseja excluir esta apresentação?')) {
                                                        onDelete(pres.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
