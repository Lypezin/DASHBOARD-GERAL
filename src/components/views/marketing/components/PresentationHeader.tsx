'use client';

import React from 'react';
import { Presentation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface PresentationHeaderProps {
    isDark: boolean;
    isMarketing: boolean;
    isGenerating: boolean;
    onGenerate: () => void;
}

export const PresentationHeader: React.FC<PresentationHeaderProps> = ({
    isDark,
    isMarketing,
    isGenerating,
    onGenerate
}) => {
    const router = useRouter();

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1">
                <h1 className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Mkt <span className="text-blue-500">Presentation</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                    Gere relatórios de alto impacto visual em segundos.
                </p>
            </div>

            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    className="rounded-xl border border-slate-200 dark:border-slate-800"
                    onClick={() => router.push('/?tab=marketing')}
                >
                    Voltar
                </Button>
                <Button
                    size="lg"
                    className={`rounded-xl px-8 font-bold shadow-xl transition-all hover:scale-105 active:scale-95 ${
                        isDark 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/50'
                    }`}
                    disabled={!isMarketing || isGenerating}
                    onClick={onGenerate}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            PREPARANDO...
                        </>
                    ) : (
                        <>
                            <Presentation className="mr-2 h-5 w-5" />
                            GERAR AGORA
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
