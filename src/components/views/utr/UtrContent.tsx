import React from 'react';
import { Building2, Clock, MapPin, Target } from 'lucide-react';
import { UtrData } from '@/types';
import { UtrGeral } from './UtrGeral';
import { UtrSection } from './UtrSection';

interface UtrContentProps {
    utrData: UtrData;
    porPraca: any[];
    porSubPraca: any[];
    porOrigem: any[];
    porTurno: any[];
}

export const UtrContent = React.memo(function UtrContent({
    utrData,
    porPraca,
    porSubPraca,
    porOrigem,
    porTurno
}: UtrContentProps) {
    return (
        <div className="space-y-5">
            <UtrGeral data={utrData.geral} />

            <section aria-labelledby="utr-segments-title" className="space-y-3">
                <div className="px-0.5">
                    <h2 id="utr-segments-title" className="text-[15px] font-semibold tracking-tight text-[#183f58] dark:text-slate-100">Desempenho por segmento</h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">UTR, tempo e corridas nos recortes operacionais disponíveis.</p>
                </div>

                <div className="grid gap-3 xl:grid-cols-2">
                    <UtrSection
                        title="Praça"
                        description="Desempenho por polo operacional."
                        icon={<Building2 className="h-4 w-4 text-[#347ca3] dark:text-sky-300" />}
                        data={porPraca}
                        getLabel={(item) => item.praca}
                    />

                    <UtrSection
                        title="Sub-praça"
                        description="Detalhamento por recorte interno."
                        icon={<MapPin className="h-4 w-4 text-[#347ca3] dark:text-sky-300" />}
                        data={porSubPraca}
                        getLabel={(item) => item.sub_praca}
                    />

                    <UtrSection
                        title="Origem"
                        description="Distribuição por canal operacional."
                        icon={<Target className="h-4 w-4 text-[#347ca3] dark:text-sky-300" />}
                        data={porOrigem}
                        getLabel={(item) => item.origem}
                    />

                    <UtrSection
                        title="Turno"
                        description="Comparativo por janela operacional."
                        icon={<Clock className="h-4 w-4 text-[#347ca3] dark:text-sky-300" />}
                        data={porTurno}
                        getLabel={(item) => item.turno || item.periodo || ''}
                    />
                </div>
            </section>
        </div>
    );
});

UtrContent.displayName = 'UtrContent';
