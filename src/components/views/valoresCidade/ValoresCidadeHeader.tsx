'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const ValoresCidadeHeader: React.FC = () => {
    return (
        <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600 shadow-sm" />
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    Valores por Cidade
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Análise financeira e custo por entrega por região
                </p>
            </div>
        </div>
    );
};
