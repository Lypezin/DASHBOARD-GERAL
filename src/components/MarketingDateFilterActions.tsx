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
          variant={temAlteracao ? "default" : temFiltro ? "outline" : "secondary"}
          className="w-full h-9 text-xs font-semibold"
          type="button"
        >
          {temAlteracao ? (
            'Aplicar filtro'
          ) : temFiltro ? (
            <span className="flex items-center justify-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              Filtro ativo
            </span>
          ) : (
            'Aplicar'
          )}
        </Button>
      </CardFooter>
);
