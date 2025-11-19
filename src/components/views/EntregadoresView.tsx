'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { EntregadorMarketing, MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download } from 'lucide-react';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';
import MarketingCard from '@/components/MarketingCard';
import * as XLSX from 'xlsx';

const IS_DEV = process.env.NODE_ENV === 'development';

interface EntregadoresViewProps {
  // Este componente é usado apenas no Marketing, não recebe props
}

const EntregadoresView = React.memo(function EntregadoresView({
}: EntregadoresViewProps = {}) {
  const [entregadores, setEntregadores] = useState<EntregadorMarketing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filtroRodouDia, setFiltroRodouDia] = useState<MarketingDateFilter>({
    dataInicial: null,
    dataFinal: null,
  });
  const [filtroDataInicio, setFiltroDataInicio] = useState<MarketingDateFilter>({
    dataInicial: null,
    dataFinal: null,
  });
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>('');

  // Lista de cidades disponíveis (mesmas do MarketingDashboardView)
  const CIDADES = [
    '',
    'São Paulo 2.0',
    'Salvador 2.0',
    'Guarulhos 2.0',
    'Manaus 2.0',
    'Sorocaba 2.0',
    'Taboão da Serra e Embu das Artes 2.0',
    'Santo André',
    'São Bernardo',
  ];

  const fetchEntregadoresFallback = useCallback(async () => {
    try {
      // Fallback: buscar entregadores que aparecem em ambas as tabelas
      // Primeiro, buscar IDs únicos de entregadores do marketing
      const { data: entregadoresIds, error: idsError } = await supabase
        .from('dados_marketing')
        .select('id_entregador, nome')
        .not('id_entregador', 'is', null);

      if (idsError) throw idsError;

      if (!entregadoresIds || entregadoresIds.length === 0) {
        setEntregadores([]);
      return;
    }

      // Para cada entregador, verificar se existe em dados_corridas e agregar
      const entregadoresComDados: EntregadorMarketing[] = [];

      for (const entregador of entregadoresIds) {
        if (!entregador.id_entregador) continue;

        // Buscar primeira data do entregador em dados_corridas
        const { data: primeiraDataResult, error: primeiraDataError } = await supabase
          .from('dados_corridas')
          .select('data_do_periodo')
          .eq('id_da_pessoa_entregadora', entregador.id_entregador)
          .not('data_do_periodo', 'is', null)
          .order('data_do_periodo', { ascending: true })
          .limit(1);

        if (primeiraDataError) {
          if (IS_DEV) {
            safeLog.warn(`Erro ao buscar primeira data para entregador ${entregador.id_entregador}:`, primeiraDataError);
          }
        }

        // Aplicar filtro de data início se especificado
        if (filtroDataInicio.dataInicial || filtroDataInicio.dataFinal) {
          if (!primeiraDataResult || primeiraDataResult.length === 0) {
            continue; // Se não tem primeira data, pular
          }
          
          const primeiraData = primeiraDataResult[0].data_do_periodo;
          if (!primeiraData) {
            continue;
          }

          // Verificar se a primeira data está dentro do intervalo
          const dataInicio = filtroDataInicio.dataInicial;
          const dataFim = filtroDataInicio.dataFinal;
          
          if (dataInicio && primeiraData < dataInicio) {
            continue; // Primeira data é anterior ao início do intervalo
          }
          if (dataFim && primeiraData > dataFim) {
            continue; // Primeira data é posterior ao fim do intervalo
          }
        }

        // Verificar se o ID existe em dados_corridas e agregar
        const { data: corridasData, error: corridasError } = await supabase
          .from('dados_corridas')
          .select('numero_de_corridas_ofertadas, numero_de_corridas_aceitas, numero_de_corridas_completadas, numero_de_corridas_rejeitadas')
          .eq('id_da_pessoa_entregadora', entregador.id_entregador);

        if (corridasError) {
            if (IS_DEV) {
            safeLog.warn(`Erro ao buscar corridas para entregador ${entregador.id_entregador}:`, corridasError);
          }
          continue;
        }

        // Se não há corridas, pular este entregador
        if (!corridasData || corridasData.length === 0) {
          continue;
        }

        // Agregar dados
        const total_ofertadas = corridasData.reduce((sum, c) => sum + (c.numero_de_corridas_ofertadas || 0), 0);
        const total_aceitas = corridasData.reduce((sum, c) => sum + (c.numero_de_corridas_aceitas || 0), 0);
        const total_completadas = corridasData.reduce((sum, c) => sum + (c.numero_de_corridas_completadas || 0), 0);
        const total_rejeitadas = corridasData.reduce((sum, c) => sum + (c.numero_de_corridas_rejeitadas || 0), 0);

        entregadoresComDados.push({
          id_entregador: entregador.id_entregador,
          nome: entregador.nome || 'Nome não informado',
          total_ofertadas,
          total_aceitas,
          total_completadas,
          total_rejeitadas,
          total_segundos: 0, // Fallback não calcula horas
          ultima_data: null, // Fallback não calcula última data
          dias_sem_rodar: null, // Fallback não calcula dias sem rodar
          regiao_atuacao: null, // Fallback não calcula região
        });
      }

      // Ordenar por nome
      entregadoresComDados.sort((a, b) => a.nome.localeCompare(b.nome));

      setEntregadores(entregadoresComDados);

      if (IS_DEV) {
        safeLog.info(`✅ ${entregadoresComDados.length} entregador(es) encontrado(s) (fallback)`);
      }
    } catch (err: any) {
      safeLog.error('Erro no fallback ao buscar entregadores:', err);
      throw err;
    }
  }, [filtroDataInicio]);

  const fetchEntregadores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Preparar parâmetros do filtro rodou_dia, data início e cidade
      const params: any = {};
      
      if (filtroRodouDia.dataInicial || filtroRodouDia.dataFinal) {
        params.rodou_dia_inicial = filtroRodouDia.dataInicial || null;
        params.rodou_dia_final = filtroRodouDia.dataFinal || null;
      }
      
      if (filtroDataInicio.dataInicial || filtroDataInicio.dataFinal) {
        params.data_inicio_inicial = filtroDataInicio.dataInicial || null;
        params.data_inicio_final = filtroDataInicio.dataFinal || null;
      }
      
      if (cidadeSelecionada) {
        params.cidade = cidadeSelecionada;
      }
      
      const finalParams = Object.keys(params).length > 0 ? params : undefined;

      // Usar função RPC para buscar entregadores com dados agregados
      const { data, error: rpcError } = await safeRpc<EntregadorMarketing[]>('get_entregadores_marketing', finalParams, {
        timeout: 30000,
        validateParams: false
      });

      if (rpcError) {
        // Se a função RPC não existir, fazer fallback para query direta
        const errorCode = (rpcError as any)?.code || '';
        const errorMessage = String((rpcError as any)?.message || '');
        const is404 = errorCode === 'PGRST116' || errorCode === '42883' || 
                      errorCode === 'PGRST204' ||
                      errorMessage.includes('404') || 
                      errorMessage.includes('not found');

        if (is404) {
          // Função RPC não existe, usar fallback
          if (IS_DEV) {
            safeLog.warn('Função RPC get_entregadores_marketing não encontrada, usando fallback');
          }
          await fetchEntregadoresFallback();
          return;
        }
        
        throw rpcError;
      }

      if (!data || !Array.isArray(data)) {
        setEntregadores([]);
        setLoading(false);
        return;
      }

      setEntregadores(data);

      if (IS_DEV) {
        safeLog.info(`✅ ${data.length} entregador(es) encontrado(s)`);
      }
    } catch (err: any) {
      safeLog.error('Erro ao buscar entregadores:', err);
      setError(err.message || 'Erro ao carregar entregadores');
    } finally {
      setLoading(false);
    }
  }, [fetchEntregadoresFallback, filtroRodouDia, filtroDataInicio, cidadeSelecionada]);

  useEffect(() => {
    // Este componente é usado apenas no Marketing, sempre buscar dados
    fetchEntregadores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchEntregadores]);

  // Usar loading interno
  const isLoading = loading;

  // Filtrar entregadores por nome ou ID
  const entregadoresFiltrados = useMemo(() => {
    if (!searchTerm.trim()) {
      return entregadores;
    }
    
    const termo = searchTerm.toLowerCase().trim();
    return entregadores.filter(e => 
      e.nome.toLowerCase().includes(termo) ||
      e.id_entregador.toLowerCase().includes(termo)
    );
  }, [entregadores, searchTerm]);

  // Função para formatar segundos em horas (HH:MM:SS)
  const formatarSegundosParaHoras = useCallback((segundos: number): string => {
    if (!segundos || segundos === 0) return '00:00:00';
    const horas = segundos / 3600;
    return formatarHorasParaHMS(horas);
  }, []);

  // Calcular totais para os cartões
  const totais = useMemo(() => {
    const totalEntregadores = entregadoresFiltrados.length;
    const totalSegundos = entregadoresFiltrados.reduce((sum, e) => sum + (e.total_segundos || 0), 0);
    return {
      totalEntregadores,
      totalSegundos,
    };
  }, [entregadoresFiltrados]);

  // Função para exportar dados para Excel
  const exportarParaExcel = useCallback(() => {
    try {
      // Preparar dados para exportação
      const dadosExportacao = entregadoresFiltrados.map((entregador) => ({
        'ID Entregador': entregador.id_entregador,
        'Nome': entregador.nome,
        'Cidade': entregador.regiao_atuacao || 'N/A',
        'Total Ofertadas': entregador.total_ofertadas,
        'Total Aceitas': entregador.total_aceitas,
        'Total Completadas': entregador.total_completadas,
        'Total Rejeitadas': entregador.total_rejeitadas,
        'Horas (HH:MM:SS)': formatarSegundosParaHoras(entregador.total_segundos || 0),
        'Última Data': entregador.ultima_data || 'N/A',
        'Dias sem Rodar': entregador.dias_sem_rodar === null || entregador.dias_sem_rodar === undefined
          ? 'N/A'
          : entregador.dias_sem_rodar === 0
          ? 'Hoje'
          : `${entregador.dias_sem_rodar} dia${entregador.dias_sem_rodar !== 1 ? 's' : ''}`,
        'Rodando': entregador.total_completadas > 30 ? 'SIM' : 'NÃO',
      }));

      // Criar workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dadosExportacao);

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 36 }, // ID Entregador
        { wch: 40 }, // Nome
        { wch: 30 }, // Cidade
        { wch: 15 }, // Total Ofertadas
        { wch: 15 }, // Total Aceitas
        { wch: 18 }, // Total Completadas
        { wch: 18 }, // Total Rejeitadas
        { wch: 15 }, // Horas
        { wch: 12 }, // Última Data
        { wch: 15 }, // Dias sem Rodar
        { wch: 12 }, // Rodando
      ];
      ws['!cols'] = colWidths;

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Entregadores');

      // Gerar nome do arquivo com data/hora
      const agora = new Date();
      const dataHora = agora.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
      const nomeArquivo = `entregadores_marketing_${dataHora}.xlsx`;

      // Exportar arquivo
      XLSX.writeFile(wb, nomeArquivo);

      if (IS_DEV) {
        safeLog.info(`✅ Arquivo Excel exportado: ${nomeArquivo} (${dadosExportacao.length} registros)`);
      }
    } catch (err: any) {
      safeLog.error('Erro ao exportar para Excel:', err);
      alert('Erro ao exportar dados para Excel. Por favor, tente novamente.');
    }
  }, [entregadoresFiltrados, formatarSegundosParaHoras]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center animate-pulse-soft">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
          <p className="mt-4 text-lg font-semibold text-purple-700 dark:text-purple-200">Carregando entregadores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center animate-fade-in">
        <div className="max-w-sm mx-auto rounded-xl border border-rose-200 bg-white p-6 text-center shadow-xl dark:border-rose-900 dark:bg-slate-900">
          <div className="text-4xl">⚠️</div>
          <p className="mt-4 text-lg font-bold text-rose-900 dark:text-rose-100">Erro ao carregar entregadores</p>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchEntregadores();
            }}
            className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-rose-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

    return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-6 dark:border-purple-900 dark:from-purple-950/30 dark:to-pink-950/30">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              Entregadores do Marketing
            </h2>
            <p className="mt-2 text-sm text-purple-700 dark:text-purple-300">
              Entregadores que aparecem tanto no marketing quanto nas corridas ({entregadoresFiltrados.length} de {entregadores.length} entregador{entregadores.length !== 1 ? 'es' : ''})
            </p>
          </div>
          <Button
            onClick={exportarParaExcel}
            disabled={entregadoresFiltrados.length === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-700 dark:hover:bg-purple-800 shrink-0"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
      </div>
      </div>

      {/* Filtros com design premium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Campo de Busca */}
        <div className="group relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20 p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 dark:from-slate-800 dark:via-purple-950/20 dark:to-pink-950/20">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-2xl transition-opacity group-hover:opacity-50"></div>
          </div>
          <div className="relative">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
              🔍 Buscar Entregador
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transform text-purple-500" />
              <Input
                type="text"
                placeholder="Pesquisar por nome ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 rounded-xl border-2 border-slate-200 bg-white pl-11 pr-4 text-sm transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 hover:border-purple-300 dark:border-slate-700 dark:bg-slate-800 dark:focus:border-purple-400 dark:hover:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Filtro de Cidade */}
        <div className="group relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20 p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 dark:from-slate-800 dark:via-purple-950/20 dark:to-pink-950/20">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-gradient-to-tr from-pink-500/10 to-purple-500/10 blur-2xl transition-opacity group-hover:opacity-50"></div>
          </div>
          <div className="relative">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
              📍 Cidade
            </label>
            <select
              value={cidadeSelecionada}
              onChange={(e) => setCidadeSelecionada(e.target.value)}
              className="h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition-all duration-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 hover:border-purple-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-purple-400 dark:hover:border-purple-500"
            >
              {CIDADES.map((cidade) => (
                <option key={cidade} value={cidade}>
                  {cidade || 'Todas as cidades'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtro Rodou Dia */}
        <MarketingDateFilterComponent
          label="Filtro de Rodou Dia"
          filter={filtroRodouDia}
          onFilterChange={(filter) => {
            setFiltroRodouDia(filter);
            // O fetchEntregadores será chamado automaticamente pelo useEffect quando filtroRodouDia mudar
          }}
        />
        
        {/* Filtro Data Início */}
        <MarketingDateFilterComponent
          label="Data Início"
          filter={filtroDataInicio}
          onFilterChange={(filter) => {
            setFiltroDataInicio(filter);
            // O fetchEntregadores será chamado automaticamente pelo useEffect quando filtroDataInicio mudar
          }}
        />
      </div>

      {/* Cartões de Total */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MarketingCard
          title="Total de Entregadores"
          value={totais.totalEntregadores}
          icon="👥"
          color="purple"
        />
        <div className="group relative overflow-hidden rounded-xl border border-slate-200/50 bg-white/90 backdrop-blur-sm p-4 sm:p-5 md:p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-slate-300 dark:border-slate-700/50 dark:bg-slate-900/90">
          <div className="absolute right-0 top-0 h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 opacity-10 blur-3xl transition-opacity group-hover:opacity-25"></div>
          <div className="relative flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0 pr-2 sm:pr-3 overflow-hidden">
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 truncate">Total de Horas</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 transition-transform group-hover:scale-105 dark:text-white leading-tight break-words" style={{ fontVariantNumeric: 'tabular-nums', wordBreak: 'break-word' }}>
                {formatarSegundosParaHoras(totais.totalSegundos)}
              </p>
            </div>
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-lg sm:text-xl md:text-2xl text-white shadow-xl ring-2 ring-white/20 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:shadow-2xl">
              ⏱️
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Entregadores */}
      {entregadores.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                    Nome
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                    Cidade
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                    Ofertadas
                </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                    Aceitas
                </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                    Completadas
                </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                    Rejeitadas
                </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                    Horas
                </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                    Dias sem Rodar
                </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">
                    Rodando
                </th>
              </tr>
            </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {entregadoresFiltrados.map((entregador, idx) => {
                  const estaRodando = entregador.total_completadas > 30;
                return (
                <tr
                      key={entregador.id_entregador}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                          {entregador.id_entregador.substring(0, 8)}...
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {entregador.nome}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          {entregador.regiao_atuacao || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {entregador.total_ofertadas.toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {entregador.total_aceitas.toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {entregador.total_completadas.toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                          {entregador.total_rejeitadas.toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                          {formatarSegundosParaHoras(entregador.total_segundos || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-sm font-semibold ${
                          entregador.dias_sem_rodar === null || entregador.dias_sem_rodar === undefined
                            ? 'text-slate-400 dark:text-slate-500'
                            : entregador.dias_sem_rodar === 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : entregador.dias_sem_rodar <= 3
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {entregador.dias_sem_rodar === null || entregador.dias_sem_rodar === undefined
                            ? 'N/A'
                            : entregador.dias_sem_rodar === 0
                            ? 'Hoje'
                            : `${entregador.dias_sem_rodar} dia${entregador.dias_sem_rodar !== 1 ? 's' : ''}`
                          }
                      </span>
                  </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-sm font-semibold ${
                          estaRodando
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}>
                          {estaRodando ? 'SIM' : 'NÃO'}
                      </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">
            {searchTerm.trim() ? 'Nenhum entregador encontrado' : 'Nenhum entregador disponível'}
          </p>
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            {searchTerm.trim() 
              ? `Nenhum entregador corresponde à pesquisa "${searchTerm}".`
              : 'Não há entregadores que aparecem tanto no marketing quanto nas corridas.'}
          </p>
        </div>
      )}
    </div>
  );
});

EntregadoresView.displayName = 'EntregadoresView';

export default EntregadoresView;
