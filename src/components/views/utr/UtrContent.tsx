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
        <>
            <section className="space-y-4">
                <div className="mb-4 flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Visao consolidada</h2>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                </div>
                <UtrGeral data={utrData.geral} />
            </section>

            <section className="space-y-4">
                <div className="mb-4 flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Detalhamento operacional</h2>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                </div>
                <div className="grid gap-5 xl:grid-cols-2">
                    <UtrSection
                        title="Praca"
                        description="Desempenho por polo operacional."
                        icon={<Building2 className="h-[18px] w-[18px] text-sky-600 dark:text-sky-300" />}
                        data={porPraca}
                        getLabel={(item) => item.praca}
                    />

                    <UtrSection
                        title="Sub-praca"
                        description="Detalhamento por recorte interno."
                        icon={<MapPin className="h-[18px] w-[18px] text-cyan-600 dark:text-cyan-300" />}
                        data={porSubPraca}
                        getLabel={(item) => item.sub_praca}
                    />

                    <UtrSection
                        title="Origem"
                        description="Distribuicao por canal operacional."
                        icon={<Target className="h-[18px] w-[18px] text-rose-600 dark:text-rose-300" />}
                        data={porOrigem}
                        getLabel={(item) => item.origem}
                    />

                    <UtrSection
                        title="Turno"
                        description="Comparativo por janela operacional."
                        icon={<Clock className="h-[18px] w-[18px] text-amber-600 dark:text-amber-300" />}
                        data={porTurno}
                        getLabel={(item) => item.turno || item.periodo || ''}
                    />
                </div>
            </section>
        </>
    );
});
