import React from 'react';
import { motion, Variants } from 'framer-motion';
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
    variants: Variants;
}

export const UtrContent = React.memo(function UtrContent({
    utrData,
    porPraca,
    porSubPraca,
    porOrigem,
    porTurno,
    variants
}: UtrContentProps) {
    return (
        <React.Fragment>
            <motion.div variants={variants}>
                <UtrGeral data={utrData.geral} />
            </motion.div>

            <motion.div variants={variants} className="grid gap-5 xl:grid-cols-2">
                <UtrSection
                    title="Praca"
                    description="Desempenho por polo operacional."
                    icon={<Building2 className="h-[18px] w-[18px] text-indigo-600 dark:text-indigo-300" />}
                    data={porPraca}
                    getLabel={(item) => item.praca}
                    gridCols="sm:grid-cols-2 2xl:grid-cols-3"
                />

                <UtrSection
                    title="Sub-praca"
                    description="Detalhamento por recorte interno."
                    icon={<MapPin className="h-[18px] w-[18px] text-violet-600 dark:text-violet-300" />}
                    data={porSubPraca}
                    getLabel={(item) => item.sub_praca}
                    gridCols="sm:grid-cols-2 2xl:grid-cols-3"
                />

                <UtrSection
                    title="Origem"
                    description="Distribuicao por canal operacional."
                    icon={<Target className="h-[18px] w-[18px] text-rose-600 dark:text-rose-300" />}
                    data={porOrigem}
                    getLabel={(item) => item.origem}
                    gridCols="sm:grid-cols-2 2xl:grid-cols-3"
                />

                <UtrSection
                    title="Turno"
                    description="Comparativo por janela operacional."
                    icon={<Clock className="h-[18px] w-[18px] text-amber-600 dark:text-amber-300" />}
                    data={porTurno}
                    getLabel={(item) => item.turno || item.periodo || ''}
                    gridCols="sm:grid-cols-2 2xl:grid-cols-3"
                />
            </motion.div>
        </React.Fragment>
    );
});
