import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ApresentacaoLoadingOverlayProps {
    isGenerating: boolean;
    current: number;
    total: number;
}

export const ApresentacaoLoadingOverlay: React.FC<ApresentacaoLoadingOverlayProps> = ({ isGenerating, current, total }) => {
    if (!isGenerating) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-[100070] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
            <Card className="p-8 shadow-2xl flex flex-col items-center gap-6 max-w-sm mx-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse motion-reduce:animate-none" aria-hidden="true"></div>
                    <Loader2 className="relative z-10 h-12 w-12 animate-spin text-blue-600 motion-reduce:animate-none" aria-hidden="true" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Gerando PDF
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Processando slide {current} de {total}...
                    </p>
                    {/* Progress bar */}
                    <div className="w-48 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-[width] duration-300 motion-reduce:transition-none"
                            style={{
                                width: total > 0
                                    ? `${(current / total) * 100}%`
                                    : '0%'
                            }}
                        />
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        Aguarde, não feche esta janela
                    </p>
                </div>
            </Card>
        </div>
    );
};
