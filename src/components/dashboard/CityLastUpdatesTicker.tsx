'use client';

import React from 'react';
import { useCityLastUpdates } from '@/hooks/data/useCityLastUpdates';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

export function CityLastUpdatesTicker() {
    const { data, loading } = useCityLastUpdates();

    if (loading) {
        return <div className="p-4 text-xs text-center text-slate-500">Carregando atualizações...</div>;
    }

    if (!data || data.length === 0) {
        return (
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm mb-6">
                <strong>Debug:</strong> Nenhuma atualização encontrada.
                <br />
                Verifique se o script SQL foi executado e se existem dados na tabela <code>dados_corridas</code>.
            </div>
        );
    }

    return (
        <div className="w-full mb-6">
            <Card className="border-none shadow-sm bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-900/50 dark:to-slate-800/50 backdrop-blur-sm overflow-hidden">
                <div className="flex items-center px-4 py-3">
                    <div className="flex items-center gap-2 mr-6 text-indigo-600 dark:text-indigo-400 font-medium whitespace-nowrap">
                        <RefreshCw className="h-4 w-4 animate-spin-slow" />
                        <span className="text-sm">Última Atualização:</span>
                    </div>

                    <div className="flex-1 overflow-hidden relative group">
                        {/* Mask for fading edges */}
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-blue-50/0 dark:from-slate-900/0 z-10"></div>
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-blue-50/0 dark:to-slate-900/0 z-10"></div>

                        <div className="flex animate-marquee hover:pause-animation whitespace-nowrap gap-8">
                            {/* Duplicate list for infinite scroll effect */}
                            {[...data, ...data].map((item, index) => (
                                <div key={`${item.city}-${index}`} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <span className="font-semibold text-slate-800 dark:text-slate-100">{item.city}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                    <span>
                                        {item.last_update_date
                                            ? format(parseISO(item.last_update_date), "dd 'de' MMM, HH:mm", { locale: ptBR })
                                            : 'N/A'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-spin-slow {
            animation: spin 8s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .pause-animation:hover {
            animation-play-state: paused;
        }
      `}</style>
        </div>
    );
}
