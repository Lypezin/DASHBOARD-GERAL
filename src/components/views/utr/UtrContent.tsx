
import React from 'react';
import { Building2, MapPin, Target, Clock } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { UtrGeral } from './UtrGeral';
import { UtrSection } from './UtrSection';
import { UtrData } from '@/types';

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
            {/* UTR Geral */}
            <motion.div variants={variants}>
                <UtrGeral data={utrData.geral} />
            </motion.div>

            {/* UTR por Praça */}
            <motion.div variants={variants}>
                <UtrSection
                    title="UTR por Praça"
                    description="Análise por praça operacional"
                    icon={<Building2 className="h-5 w-5 text-indigo-500" />}
                    data={porPraca}
                    getLabel={(item) => item.praca}
                />
            </motion.div>

            {/* UTR por Sub-Praça */}
            <motion.div variants={variants}>
                <UtrSection
                    title="UTR por Sub-Praça"
                    description="Análise por sub-praça operacional"
                    icon={<MapPin className="h-5 w-5 text-violet-500" />}
                    data={porSubPraca}
                    getLabel={(item) => item.sub_praca}
                />
            </motion.div>

            {/* UTR por Origem */}
            <motion.div variants={variants}>
                <UtrSection
                    title="UTR por Origem"
                    description="Análise por origem operacional"
                    icon={<Target className="h-5 w-5 text-rose-500" />}
                    data={porOrigem}
                    getLabel={(item) => item.origem}
                />
            </motion.div>

            {/* UTR por Turno */}
            <motion.div variants={variants}>
                <UtrSection
                    title="UTR por Turno"
                    description="Análise por turno operacional"
                    icon={<Clock className="h-5 w-5 text-amber-500" />}
                    data={porTurno}
                    getLabel={(item) => item.turno || item.periodo || ''}
                    gridCols="md:grid-cols-2 lg:grid-cols-4"
                />
            </motion.div>
        </React.Fragment>
    );
});
