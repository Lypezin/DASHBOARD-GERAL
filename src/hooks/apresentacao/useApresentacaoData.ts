import { useMemo } from 'react';
import { DashboardResumoData } from '@/types';
import { processarDadosBasicos, processarDadosCompletos, DadosBasicos, DadosProcessados } from '@/utils/apresentacao/dataProcessor';

export const useApresentacaoData = (
  dadosComparacao: DashboardResumoData[],
  semanasSelecionadas: string[]
) => {
  const dadosBasicos = useMemo(() => {
    return processarDadosBasicos(dadosComparacao, semanasSelecionadas);
  }, [dadosComparacao, semanasSelecionadas]);

  const dadosProcessados = useMemo(() => {
    return processarDadosCompletos(dadosBasicos);
  }, [dadosBasicos]);

  return {
    dadosBasicos,
    dadosProcessados,
  };
};

