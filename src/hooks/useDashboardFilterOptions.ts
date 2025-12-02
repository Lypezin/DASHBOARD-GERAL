/**
 * Hook para buscar opções de filtros do dashboard
 * Separa lógica de busca de opções de filtros (praças, sub-praças, origens, turnos)
 */

import { useState, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { FilterOption, CurrentUser, hasFullCityAccess, DimensoesDashboard } from '@/types';
import { RPC_TIMEOUTS } from '@/constants/config';

const IS_DEV = process.env.NODE_ENV === 'development';

interface UseDashboardFiltersOptions {
  dimensoes: DimensoesDashboard | null;
  currentUser?: CurrentUser | null;
}

/**
 * Hook para buscar opções de filtros do dashboard
 */
export function useDashboardFilterOptions(options: UseDashboardFiltersOptions) {
  const { dimensoes, currentUser } = options;

  const [pracas, setPracas] = useState<FilterOption[]>([]);
  const [subPracas, setSubPracas] = useState<FilterOption[]>([]);
  const [origens, setOrigens] = useState<FilterOption[]>([]);
  const [turnos, setTurnos] = useState<FilterOption[]>([]);

  useEffect(() => {
    if (IS_DEV) {
      safeLog.info('[useDashboardFilters] useEffect acionado:', {
        hasDimensoes: !!dimensoes,
        dimensoesPracas: dimensoes?.pracas,
        dimensoesPracasLength: Array.isArray(dimensoes?.pracas) ? dimensoes.pracas.length : 0,
        currentUser: currentUser ? { is_admin: currentUser.is_admin, assigned_pracas: currentUser.assigned_pracas } : null,
      });
    }

    if (!dimensoes) {
      if (IS_DEV) {
        safeLog.warn('[useDashboardFilters] Dimensões não disponíveis ainda');
      }
      setPracas([]);
      setSubPracas([]);
      setOrigens([]);
      setTurnos([]);
      return;
    }

    // Processar praças
    let pracasDisponiveis: FilterOption[] = Array.isArray(dimensoes.pracas)
      ? dimensoes.pracas.map((p: string | number) => ({ value: String(p), label: String(p) }))
      : [];

    if (IS_DEV) {
      safeLog.info('[useDashboardFilters] Praças antes de filtrar:', {
        total: pracasDisponiveis.length,
        pracas: pracasDisponiveis.map(p => p.value),
      });
    }

    // Filtrar praças baseado nas permissões do usuário
    if (currentUser && !hasFullCityAccess(currentUser) && currentUser.assigned_pracas.length > 0) {
      const pracasPermitidas = new Set(currentUser.assigned_pracas);
      pracasDisponiveis = pracasDisponiveis.filter((p) => pracasPermitidas.has(p.value));
      if (IS_DEV) {
        safeLog.info('[useDashboardFilters] Praças após filtrar por permissões:', {
          total: pracasDisponiveis.length,
          pracas: pracasDisponiveis.map(p => p.value),
          assigned_pracas: currentUser.assigned_pracas,
        });
      }
    }

    if (IS_DEV) {
      safeLog.info('[useDashboardFilters] Definindo praças:', {
        total: pracasDisponiveis.length,
        pracas: pracasDisponiveis.map(p => p.value),
      });
    }

    setPracas(pracasDisponiveis);

    // Filtrar dimensões (sub-praças, turnos, origens) baseado nas praças permitidas do usuário
    if (currentUser && !hasFullCityAccess(currentUser) && currentUser.assigned_pracas.length > 0) {
      // Buscar todas as dimensões em paralelo para melhor performance
      Promise.all([
        safeRpc<Array<{ sub_praca: string }>>('get_subpracas_by_praca', { p_pracas: currentUser.assigned_pracas }, {
          timeout: RPC_TIMEOUTS.FAST,
          validateParams: false
        }),
        safeRpc<Array<{ turno: string }>>('get_turnos_by_praca', { p_pracas: currentUser.assigned_pracas }, {
          timeout: RPC_TIMEOUTS.FAST,
          validateParams: false
        }),
        safeRpc<Array<{ origem: string }>>('get_origens_by_praca', { p_pracas: currentUser.assigned_pracas }, {
          timeout: RPC_TIMEOUTS.FAST,
          validateParams: false
        })
      ])
        .then(([subPracasResult, turnosResult, origensResult]) => {
          // Processar sub-praças
          let subPracasDisponiveis: FilterOption[] = [];
          if (!subPracasResult.error && subPracasResult.data && Array.isArray(subPracasResult.data)) {
            subPracasDisponiveis = subPracasResult.data.map((item: any) => {
              const value = typeof item === 'object' && item !== null ? (item.sub_praca || Object.values(item)[0]) : item;
              return {
                value: String(value),
                label: String(value)
              };
            });
          } else {
            // Fallback: filtrar por nome
            if (IS_DEV) {
              safeLog.warn('Erro ao buscar sub-praças do banco, usando fallback:', subPracasResult.error);
            }
            const subPracasDoDashboard = Array.isArray(dimensoes.sub_pracas)
              ? dimensoes.sub_pracas.map((p: string | number) => ({ value: String(p), label: String(p) }))
              : [];
            subPracasDisponiveis = subPracasDoDashboard.filter((sp) => {
              const subPracaValue = sp.value.toUpperCase();
              return currentUser.assigned_pracas.some((praca) => {
                const pracaValue = praca.toUpperCase();
                return subPracaValue.includes(pracaValue) || subPracaValue.startsWith(pracaValue);
              });
            });
          }
          setSubPracas(subPracasDisponiveis);

          // Processar turnos
          let turnosDisponiveis: FilterOption[] = [];
          if (!turnosResult.error && turnosResult.data && Array.isArray(turnosResult.data)) {
            turnosDisponiveis = turnosResult.data.map((item: any) => {
              const value = typeof item === 'object' && item !== null ? (item.turno || Object.values(item)[0]) : item;
              return {
                value: String(value),
                label: String(value)
              };
            });
          } else {
            // Fallback: usar do dashboard
            if (IS_DEV) {
              safeLog.warn('Erro ao buscar turnos do banco, usando fallback:', turnosResult.error);
            }
            turnosDisponiveis = Array.isArray((dimensoes as { turnos?: (string | number)[] }).turnos)
              ? (dimensoes as { turnos: (string | number)[] }).turnos.map((t: string | number) => ({ value: String(t), label: String(t) }))
              : [];
          }
          setTurnos(turnosDisponiveis);

          // Processar origens
          let origensDisponiveis: FilterOption[] = [];
          if (!origensResult.error && origensResult.data && Array.isArray(origensResult.data)) {
            origensDisponiveis = origensResult.data.map((item: any) => {
              const value = typeof item === 'object' && item !== null ? (item.origem || Object.values(item)[0]) : item;
              return {
                value: String(value),
                label: String(value)
              };
            });
          } else {
            // Fallback: usar do dashboard
            if (IS_DEV) {
              safeLog.warn('Erro ao buscar origens do banco, usando fallback:', origensResult.error);
            }
            origensDisponiveis = Array.isArray(dimensoes.origens)
              ? dimensoes.origens.map((p: string | number) => ({ value: String(p), label: String(p) }))
              : [];
          }
          setOrigens(origensDisponiveis);
        })
        .catch((err) => {
          // Em caso de erro geral, usar fallback para todas as dimensões
          if (IS_DEV) {
            safeLog.warn('Erro ao buscar dimensões do banco, usando fallback:', err);
          }
          const subPracasDoDashboard = Array.isArray(dimensoes.sub_pracas)
            ? dimensoes.sub_pracas.map((p: any) => ({ value: String(p), label: String(p) }))
            : [];
          const subPracasFiltradas = subPracasDoDashboard.filter((sp) => {
            const subPracaValue = sp.value.toUpperCase();
            return currentUser.assigned_pracas.some((praca) => {
              const pracaValue = praca.toUpperCase();
              return subPracaValue.includes(pracaValue) || subPracaValue.startsWith(pracaValue);
            });
          });
          setSubPracas(subPracasFiltradas);
          setTurnos(Array.isArray((dimensoes as { turnos?: (string | number)[] }).turnos)
            ? (dimensoes as { turnos: (string | number)[] }).turnos.map((t: string | number) => ({ value: String(t), label: String(t) }))
            : []);
          setOrigens(Array.isArray(dimensoes.origens)
            ? dimensoes.origens.map((p: any) => ({ value: String(p), label: String(p) }))
            : []);
        });
    } else {
      // Se for admin ou não tiver restrições, usar todas as dimensões do dashboard_resumo
      setSubPracas(Array.isArray(dimensoes.sub_pracas)
        ? dimensoes.sub_pracas.map((p: any) => ({ value: String(p), label: String(p) }))
        : []);
      setTurnos(Array.isArray((dimensoes as { turnos?: (string | number)[] }).turnos)
        ? (dimensoes as { turnos: (string | number)[] }).turnos.map((t: string | number) => ({ value: String(t), label: String(t) }))
        : []);
      setOrigens(Array.isArray(dimensoes.origens)
        ? dimensoes.origens.map((p: any) => ({ value: String(p), label: String(p) }))
        : []);
    }
  }, [dimensoes, currentUser]);

  return {
    pracas,
    subPracas,
    origens,
    turnos,
  };
}

