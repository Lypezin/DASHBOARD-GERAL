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
        <div className="space-y-10">
            {/* Seção 1: Indicadores Consolidados */}
            <section className="space-y-4">
                <UtrGeral data={utrData.geral} />
            </section>

            {/* Seção 2: Detalhamento por Dimensões */}
            <section className="space-y-4">
                <div className="pt-2 px-1">
                    <h2 className="text-[10px] sm:text-xs font-bold text-muted-foreground/80 uppercase tracking-wider">
                        Detalhamento por Segmentos
                    </h2>
                </div>
                
                <div className="grid gap-6 xl:grid-cols-2">
                    <UtrSection
                        title="Praça"
                        description="Desempenho por polo operacional."
                        icon={<Building2 className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" />}
                        data={porPraca}
                        getLabel={(item) => item.praca}
                    />

                    <UtrSection
                        title="Sub-praça"
                        description="Detalhamento por recorte interno."
                        icon={<MapPin className="h-4.5 w-4.5 text-cyan-600 dark:text-cyan-400" />}
                        data={porSubPraca}
                        getLabel={(item) => item.sub_praca}
                    />

                    <UtrSection
                        title="Origem"
                        description="Distribuição por canal operacional."
                        icon={<Target className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />}
                        data={porOrigem}
                        getLabel={(item) => item.origem}
                    />

                    <UtrSection
                        title="Turno"
                        description="Comparativo por janela operacional."
                        icon={<Clock className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />}
                        data={porTurno}
                        getLabel={(item) => item.turno || item.periodo || ''}
                    />
                </div>
            </section>
        </div>
    );
});

UtrContent.displayName = 'UtrContent';
