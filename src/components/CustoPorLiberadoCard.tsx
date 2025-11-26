'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, CheckCircle2, Target } from 'lucide-react';

interface CustoPorLiberadoCardProps {
  cidade: string;
  custoPorLiberado: number;
  quantidadeLiberados: number;
  valorTotalEnviados: number;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

const CustoPorLiberadoCard: React.FC<CustoPorLiberadoCardProps> = ({
  cidade,
  custoPorLiberado,
  quantidadeLiberados,
  valorTotalEnviados,
  color = 'purple',
}) => {
  const colorClasses: Record<string, { gradient: string; bg: string; text: string }> = {
    blue: {
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      text: 'text-blue-700 dark:text-blue-300',
    },
    green: {
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      text: 'text-emerald-700 dark:text-emerald-300',
    },
    purple: {
      gradient: 'from-violet-500 to-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      text: 'text-purple-700 dark:text-purple-300',
    },
    orange: {
      gradient: 'from-orange-500 to-amber-500',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      text: 'text-orange-700 dark:text-orange-300',
    },
  };

  const colors = colorClasses[color];

  // Calcular quantos liberados faltam para chegar a R$ 50,00
  // Fórmula: Valor Total / (Quantidade Atual + X) = 50
  // X = (Valor Total - 50 * Quantidade Atual) / 50
  const META_CUSTO = 50;
  let faltamLiberados = 0;
  let jaAtingiuMeta = false;

  if (custoPorLiberado > META_CUSTO && quantidadeLiberados > 0) {
    // Se o custo atual é maior que R$ 50, calcular quantos faltam
    faltamLiberados = Math.ceil((valorTotalEnviados - META_CUSTO * quantidadeLiberados) / META_CUSTO);
    if (faltamLiberados < 0) {
      faltamLiberados = 0;
    }
  } else if (custoPorLiberado <= META_CUSTO && custoPorLiberado > 0) {
    // Se já está abaixo ou igual a R$ 50
    jaAtingiuMeta = true;
  }

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground truncate" title={cidade}>
          {cidade} - Custo/Liberado
        </CardTitle>
        <BarChart3 className="h-4 w-4 text-purple-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
          {formatCurrency(custoPorLiberado)}
        </div>

        {/* Informação de quantos faltam */}
        {jaAtingiuMeta ? (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Meta atingida! Abaixo de {formatCurrency(META_CUSTO)}
              </p>
            </div>
          </div>
        ) : faltamLiberados > 0 ? (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-500" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Faltam <span className="font-bold text-orange-600 dark:text-orange-400">{faltamLiberados}</span> para {formatCurrency(META_CUSTO)}
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default CustoPorLiberadoCard;

