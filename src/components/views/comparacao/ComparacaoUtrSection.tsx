import React from 'react';
import { safeLog } from '@/lib/errorHandler';
import { UtrData } from '@/types';
import { Target, AlertTriangle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SectionCard } from './components/SectionCard';

interface UtrComparacaoItem {
  semana: string;
  utr: UtrData | null;
}

interface ComparacaoUtrSectionProps {
  utrComparacao: UtrComparacaoItem[];
  semanasSelecionadas: string[];
}

// UTR Ring Chart
const UtrRing = ({ value }: { value: number }) => {
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  const color = value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-slate-200 dark:stroke-slate-700"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-slate-800 dark:text-white tabular-nums">
          {value.toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

export const ComparacaoUtrSection: React.FC<ComparacaoUtrSectionProps> = ({
  utrComparacao,
  semanasSelecionadas,
}) => {
  if (utrComparacao.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-sm text-amber-900 dark:text-amber-100">UTR não disponível</p>
            <p className="text-xs text-amber-700 dark:text-amber-300/80">Dados não carregados para as semanas selecionadas.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SectionCard
      title="UTR - Utilização de Tempo Real"
      description="Eficiência na utilização do tempo disponível"
      accentColor="bg-violet-500"
    >
      <div className="flex flex-wrap items-center justify-center gap-8">
        {utrComparacao.map((item, idx) => {
          let utrValue = 0;
          let hasError = false;

          if (item.utr) {
            if (item.utr.geral && typeof item.utr.geral === 'object' && 'utr' in item.utr.geral) {
              utrValue = item.utr.geral.utr ?? 0;
            }
          } else {
            hasError = true;
          }

          safeLog.info(`📊 UTR Semana ${item.semana}:`, { utr: utrValue, hasError });

          return (
            <div key={idx} className="flex flex-col items-center gap-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Semana {item.semana}
              </span>
              {hasError ? (
                <div className="w-[100px] h-[100px] flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <span className="text-sm font-medium text-slate-400">N/D</span>
                </div>
              ) : (
                <UtrRing value={utrValue} />
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};
