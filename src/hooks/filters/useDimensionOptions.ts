import { useState, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { FilterOption, CurrentUser, hasFullCityAccess, DimensoesDashboard, Filters } from '@/types';
import { RPC_TIMEOUTS } from '@/constants/config';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useDimensionOptions(dimensoes: DimensoesDashboard | null, currentUser?: CurrentUser | null, filters?: Filters | null) {
    const [subPracas, setSubPracas] = useState<FilterOption[]>([]);
    const [origens, setOrigens] = useState<FilterOption[]>([]);
    const [turnos, setTurnos] = useState<FilterOption[]>([]);

    useEffect(() => {
        if (!dimensoes) {
            setSubPracas([]);
            setOrigens([]);
            setTurnos([]);
            return;
        }

        let shouldCallRpc = false;
        let rpcPracasTarget: string[] = [];

        if (filters?.praca) {
            // Se o usuário selecionou uma praça específica, filtramos apenas por ela
            shouldCallRpc = true;
            rpcPracasTarget = [filters.praca];
        } else if (currentUser && !hasFullCityAccess(currentUser) && currentUser.assigned_pracas.length > 0) {
            // Se o usuário tem acesso restrito e não escolheu praça, filtramos pelas praças permitidas
            shouldCallRpc = true;
            rpcPracasTarget = currentUser.assigned_pracas;
        }

        if (shouldCallRpc && rpcPracasTarget.length > 0) {
            Promise.all([
                safeRpc<Array<{ sub_praca: string }>>('get_subpracas_by_praca', { p_pracas: rpcPracasTarget }, { timeout: RPC_TIMEOUTS.FAST, validateParams: false }),
                safeRpc<Array<{ turno: string }>>('get_turnos_by_praca', { p_pracas: rpcPracasTarget }, { timeout: RPC_TIMEOUTS.FAST, validateParams: false }),
                safeRpc<Array<{ origem: string }>>('get_origens_by_praca', { p_pracas: rpcPracasTarget }, { timeout: RPC_TIMEOUTS.FAST, validateParams: false })
            ])
                .then(([subPracasResult, turnosResult, origensResult]) => {
                    // Sub-praças
                    if (!subPracasResult.error && subPracasResult.data && Array.isArray(subPracasResult.data)) {
                        setSubPracas(subPracasResult.data.map((item: any) => ({
                            value: String(typeof item === 'object' && item !== null ? (item.sub_praca || Object.values(item)[0]) : item),
                            label: String(typeof item === 'object' && item !== null ? (item.sub_praca || Object.values(item)[0]) : item)
                        })));
                    } else {
                        const subPracasDoDashboard = Array.isArray(dimensoes.sub_pracas) ? dimensoes.sub_pracas.map((p: any) => ({ value: String(p), label: String(p) })) : [];
                        setSubPracas(subPracasDoDashboard.filter((sp) => {
                            const subPracaValue = sp.value.toUpperCase();
                            return rpcPracasTarget.some((praca) => subPracaValue.includes(praca.toUpperCase()) || subPracaValue.startsWith(praca.toUpperCase()));
                        }));
                    }

                    // Turnos
                    if (!turnosResult.error && turnosResult.data && Array.isArray(turnosResult.data)) {
                        setTurnos(turnosResult.data.map((item: any) => ({
                            value: String(typeof item === 'object' && item !== null ? (item.turno || Object.values(item)[0]) : item),
                            label: String(typeof item === 'object' && item !== null ? (item.turno || Object.values(item)[0]) : item)
                        })));
                    } else {
                        setTurnos(Array.isArray((dimensoes as any).turnos)
                            ? (dimensoes as any).turnos.map((t: any) => ({ value: String(t), label: String(t) }))
                            : []);
                    }

                    // Origens
                    if (!origensResult.error && origensResult.data && Array.isArray(origensResult.data)) {
                        setOrigens(origensResult.data.map((item: any) => ({
                            value: String(typeof item === 'object' && item !== null ? (item.origem || Object.values(item)[0]) : item),
                            label: String(typeof item === 'object' && item !== null ? (item.origem || Object.values(item)[0]) : item)
                        })));
                    } else {
                        setOrigens(Array.isArray(dimensoes.origens)
                            ? dimensoes.origens.map((p: any) => ({ value: String(p), label: String(p) }))
                            : []);
                    }
                })
                .catch((err) => {
                    if (IS_DEV) safeLog.warn('Erro ao buscar dimensões do banco, usando fallback:', err);
                    setSubPracas(processFallbackSubPracas(dimensoes, rpcPracasTarget));
                    setTurnos(mapToOptions((dimensoes as any).turnos));
                    setOrigens(mapToOptions(dimensoes.origens));
                });
        } else {
            // Fallback total se não tiver restrição ou praça selecionada
            setSubPracas(mapToOptions(dimensoes.sub_pracas));
            setTurnos(mapToOptions((dimensoes as any).turnos));
            setOrigens(mapToOptions(dimensoes.origens));
        }
    }, [dimensoes, currentUser, filters?.praca]);

    return { subPracas, origens, turnos };
}

// Helpers
function mapToOptions(arr: any[]) {
    return Array.isArray(arr) ? arr.map(p => ({ value: String(p), label: String(p) })) : [];
}

function processFallbackSubPracas(dimensoes: DimensoesDashboard, activePracas: string[]) {
    return mapToOptions(dimensoes.sub_pracas).filter(sp => activePracas.some(praca => sp.value.toUpperCase().includes(praca.toUpperCase()) || sp.value.toUpperCase().startsWith(praca.toUpperCase())));
}
