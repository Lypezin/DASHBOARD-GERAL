import React, { useState, useEffect, useMemo } from 'react';
import { FilterOption, DashboardResumoData } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import ApresentacaoView from '@/components/ApresentacaoView';
import { registerChartJS } from '@/lib/chartConfig';
import { ViewToggleButton } from './ViewToggleButton';
import { ComparacaoTabelaDetalhada } from './comparacao/ComparacaoTabelaDetalhada';
import { useComparacaoData } from '@/hooks/useComparacaoData';
import { ComparacaoFilters } from './comparacao/ComparacaoFilters';
import { ComparacaoCharts } from './comparacao/ComparacaoCharts';
import { ComparacaoMetrics } from './comparacao/ComparacaoMetrics';
import { ComparacaoSection } from './comparacao/ComparacaoSection';
import { ComparacaoSubPracaSection } from './comparacao/ComparacaoSubPracaSection';
import { ComparacaoOrigemSection } from './comparacao/ComparacaoOrigemSection';
import { ComparacaoUtrSection } from './comparacao/ComparacaoUtrSection';
import { ComparacaoDiaTable } from './comparacao/ComparacaoDiaTable';

const ComparacaoView = React.memo(function ComparacaoView({
  semanas,
  pracas,
  subPracas,
  origens,
  currentUser,
}: {
  semanas: string[];
  pracas: FilterOption[];
  subPracas: FilterOption[];
  origens: FilterOption[];
  currentUser: { is_admin: boolean; assigned_pracas: string[]; role?: 'admin' | 'marketing' | 'user' } | null;
}) {
  const [semanasSelecionadas, setSemanasSelecionadas] = useState<string[]>([]);
  const [pracaSelecionada, setPracaSelecionada] = useState<string | null>(null);
  const [mostrarApresentacao, setMostrarApresentacao] = useState(false);
  
  // Estados para controlar visualização (tabela/gráfico)
  const [viewModeDetalhada, setViewModeDetalhada] = useState<'table' | 'chart'>('table');
  const [viewModeDia, setViewModeDia] = useState<'table' | 'chart'>('table');
  const [viewModeSubPraca, setViewModeSubPraca] = useState<'table' | 'chart'>('table');
  const [viewModeOrigem, setViewModeOrigem] = useState<'table' | 'chart'>('table');

  // Usar hook para gerenciar dados de comparação
  const {
    loading,
    dadosComparacao,
    utrComparacao,
    todasSemanas,
    compararSemanas,
  } = useComparacaoData({
    semanas,
    semanasSelecionadas,
    pracaSelecionada,
    currentUser,
  });

  // Registrar Chart.js quando o componente for montado (apenas no cliente)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      registerChartJS().catch((err) => {
        safeLog.error('Erro ao registrar Chart.js:', err);
      });
    }
  }, []);

  // Se não for admin nem marketing e tiver apenas 1 praça, setar automaticamente
  // Marketing tem acesso a todas as cidades, então não precisa aplicar filtro automático
  useEffect(() => {
    const isMarketing = currentUser?.role === 'marketing';
    if (currentUser && !currentUser.is_admin && !isMarketing && currentUser.assigned_pracas.length === 1) {
      setPracaSelecionada(currentUser.assigned_pracas[0]);
    }
  }, [currentUser]);

  const toggleSemana = (semana: number | string) => {
    setSemanasSelecionadas(prev => {
      // Extrair número da semana se for formato S2025-W44
      let semanaStr = String(semana);
      if (semanaStr.includes('W')) {
        const match = semanaStr.match(/W(\d+)/);
        semanaStr = match ? match[1] : semanaStr;
      } else {
        // Se já for número, converter para string
        semanaStr = String(semana);
      }
      
      if (prev.includes(semanaStr)) {
        return prev.filter(s => s !== semanaStr);
      } else {
        return [...prev, semanaStr].sort((a, b) => {
          const numA = parseInt(a, 10);
          const numB = parseInt(b, 10);
          return numA - numB;
        });
      }
    });
  };

  const origensDisponiveis = useMemo(() => {
    const conjunto = new Set<string>();
    dadosComparacao.forEach((dados) => {
      dados?.origem?.forEach((item) => {
        const nome = item?.origem?.trim();
        if (nome) {
          conjunto.add(nome);
        }
      });
    });
    return Array.from(conjunto).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [dadosComparacao]);

  const totalColunasOrigem = useMemo(
    () => semanasSelecionadas.reduce((acc, _, idx) => acc + (idx === 0 ? 1 : 2), 0),
    [semanasSelecionadas]
  );

  // Normalizar utrComparacao para garantir que semana seja sempre string
  const utrComparacaoNormalizada = useMemo(() => {
    return utrComparacao.map(item => ({
      semana: String(item.semana),
      utr: item.utr,
    }));
  }, [utrComparacao]);

  // Verificar se deve desabilitar o filtro de praça
  // Marketing tem acesso a todas as cidades, então não precisa desabilitar o filtro
  const isMarketing = currentUser?.role === 'marketing';
  const shouldDisablePracaFilter = Boolean(currentUser && !currentUser.is_admin && !isMarketing && currentUser.assigned_pracas.length === 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <ComparacaoFilters
        pracas={pracas}
        todasSemanas={todasSemanas}
        semanasSelecionadas={semanasSelecionadas}
        pracaSelecionada={pracaSelecionada}
        shouldDisablePracaFilter={shouldDisablePracaFilter}
        onPracaChange={setPracaSelecionada}
        onToggleSemana={toggleSemana}
        onClearSemanas={() => setSemanasSelecionadas([])}
        onComparar={compararSemanas}
        onMostrarApresentacao={() => setMostrarApresentacao(true)}
        loading={loading}
        dadosComparacaoLength={dadosComparacao.length}
      />

      {/* Resultados da Comparação */}
      {dadosComparacao.length > 0 && (
        <div className="space-y-6">
          <ComparacaoMetrics dadosComparacao={dadosComparacao} />
          
          {/* Tabela de Comparação Completa */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-blue-950/30">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                  <span className="text-xl">📊</span>
                  Comparação Detalhada de Métricas
                </h3>
                <div className="flex gap-2">
                  <ViewToggleButton
                    active={viewModeDetalhada === 'table'}
                    onClick={() => setViewModeDetalhada('table')}
                    label="📋 Tabela"
                  />
                  <ViewToggleButton
                    active={viewModeDetalhada === 'chart'}
                    onClick={() => setViewModeDetalhada('chart')}
                    label="📊 Gráfico"
                  />
                </div>
              </div>
            </div>
            {viewModeDetalhada === 'table' ? (
              <ComparacaoTabelaDetalhada
                dadosComparacao={dadosComparacao}
                semanasSelecionadas={semanasSelecionadas}
              />
            ) : (
              <ComparacaoCharts
                dadosComparacao={dadosComparacao}
                semanasSelecionadas={semanasSelecionadas}
                viewMode={viewModeDetalhada}
                chartType="detalhada"
              />
            )}
          </div>
          <ComparacaoDiaTable
            dadosComparacao={dadosComparacao}
            semanasSelecionadas={semanasSelecionadas}
          />

          <ComparacaoSection
            title="Aderência por Dia da Semana"
            icon="📅"
            description="Performance de aderência distribuída pelos dias da semana"
            type="dia"
            dadosComparacao={dadosComparacao}
            semanasSelecionadas={semanasSelecionadas}
            viewMode={viewModeDia}
            onViewModeChange={setViewModeDia}
          />
          <ComparacaoSubPracaSection
            dadosComparacao={dadosComparacao}
            semanasSelecionadas={semanasSelecionadas}
            viewMode={viewModeSubPraca}
            onViewModeChange={setViewModeSubPraca}
          />

          <ComparacaoOrigemSection
            dadosComparacao={dadosComparacao}
            semanasSelecionadas={semanasSelecionadas}
            viewMode={viewModeOrigem}
            onViewModeChange={setViewModeOrigem}
            origensDisponiveis={origensDisponiveis}
            totalColunasOrigem={totalColunasOrigem}
          />

          <ComparacaoUtrSection
            utrComparacao={utrComparacaoNormalizada}
            semanasSelecionadas={semanasSelecionadas}
          />
        </div>
      )}

      {/* Modal de Apresentação */}
      {mostrarApresentacao && (
        <ApresentacaoView
          dadosComparacao={dadosComparacao}
          semanasSelecionadas={semanasSelecionadas}
          pracaSelecionada={pracaSelecionada}
          onClose={() => setMostrarApresentacao(false)}
        />
      )}
    </div>
  );
});

ComparacaoView.displayName = 'ComparacaoView';

export default ComparacaoView;
