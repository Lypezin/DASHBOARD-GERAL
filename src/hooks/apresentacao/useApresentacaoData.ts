import { useMemo } from 'react';
import { DashboardResumoData } from '@/types';
import { processarDadosBasicos, processarDadosCompletos, DadosBasicos, DadosProcessados } from '@/utils/apresentacao/dataProcessor';

export const useApresentacaoData = (
  dadosComparacao: DashboardResumoData[],
  semanasSelecionadas: string[],
  anoSelecionado?: number
) => {
  const dadosBasicos = useMemo(() => {
    return processarDadosBasicos(dadosComparacao, semanasSelecionadas, anoSelecionado);
  }, [dadosComparacao, semanasSelecionadas, anoSelecionado]);

  const dadosProcessados = useMemo(() => {
    return processarDadosCompletos(dadosBasicos);
  }, [dadosBasicos]);

  return {
    dadosBasicos,
    dadosProcessados,
  };
};

