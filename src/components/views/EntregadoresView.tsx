'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { EntregadorMarketing } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';

const IS_DEV = process.env.NODE_ENV === 'development';

const EntregadoresView = React.memo(function EntregadoresView() {
  const [entregadores, setEntregadores] = useState<EntregadorMarketing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEntregadores();
  }, []);

  const fetchEntregadores = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar função RPC para buscar entregadores com dados agregados
      const { data, error: rpcError } = await safeRpc<EntregadorMarketing[]>('get_entregadores_marketing', undefined, {
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
  };

  const fetchEntregadoresFallback = async () => {
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
  };

  if (loading) {
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
        <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100">
          Entregadores do Marketing
        </h2>
        <p className="mt-2 text-sm text-purple-700 dark:text-purple-300">
          Entregadores que aparecem tanto no marketing quanto nas corridas ({entregadores.length} entregador{entregadores.length !== 1 ? 'es' : ''})
        </p>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {entregadores.map((entregador, idx) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">
            Nenhum entregador encontrado
          </p>
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            Não há entregadores que aparecem tanto no marketing quanto nas corridas.
          </p>
        </div>
      )}
    </div>
  );
});

EntregadoresView.displayName = 'EntregadoresView';

export default EntregadoresView;
