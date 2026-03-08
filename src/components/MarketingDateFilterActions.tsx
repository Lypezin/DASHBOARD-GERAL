import React from 'react';
import { CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface MarketingDateFilterActionsProps {
    handleAplicar: () => void;
    temAlteracao: boolean;
    temFiltro: boolean;
}

export const MarketingDateFilterActions: React.FC<MarketingDateFilterActionsProps> = ({
    handleAplicar, temAlteracao, temFiltro
}) => (
      <CardFooter className="pt-0 px-4 pb-4">
        <Button
          onClick={handleAplicar}
          disabled={!temAlteracao && !temFiltro}
          size="sm"
          variant={temAlteracao ? "default" : "secondary"}
          className={`w-full h-9 text-xs font-semibold transition-all ${temAlteracao
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md shadow-purple-500/20'
            : temFiltro
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : ''
            }`}
          type="button"
        >
          {temAlteracao ? (
            <>Aplicar Filtro</>
          ) : temFiltro ? (
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              Filtro Ativo
            </span>
          ) : (
            'Aplicar'
          )}
        </Button>
      </CardFooter>
);
