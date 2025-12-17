import { useState, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { FilterOption, CurrentUser, hasFullCityAccess, DimensoesDashboard } from '@/types';
import { RPC_TIMEOUTS } from '@/constants/config';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useDimensionOptions(dimensoes: DimensoesDashboard | null, currentUser?: CurrentUser | null) {
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

        if (currentUser && !hasFullCityAccess(currentUser) && currentUser.assigned_pracas.length > 0) {
            Promise.all([
                safeRpc<Array<{ sub_praca: string }>>('get_subpracas_by_praca', { p_pracas: currentUser.assigned_pracas }, { timeout: RPC_TIMEOUTS.FAST, validateParams: false }),
                safeRpc<Array<{ turno: string }>>('get_turnos_by_praca', { p_pracas: currentUser.assigned_pracas }, { timeout: RPC_TIMEOUTS.FAST, validateParams: false }),
                safeRpc<Array<{ origem: string }>>('get_origens_by_praca', { p_pracas: currentUser.assigned_pracas }, { timeout: RPC_TIMEOUTS.FAST, validateParams: false })
            ])
                .then(([subPracasResult, turnosResult, origensResult]) => {
                    // Sub-praças
                    if (!subPracasResult.error && subPracasResult.data && Array.isArray(subPracasResult.data)) {
                        setSubPracas(subPracasResult.data.map((item: any) => ({
                            value: String(typeof item === 'object' && item !== null ? (item.sub_praca || Object.values(item)[0]) : item),
                            label: String(typeof item === 'object' && item !== null ? (item.sub_praca || Object.values(item)[0]) : item)
                        })));
                    } else {
                        // Fallback filtering logic
                        const subPracasDoDashboard = Array.isArray(dimensoes.sub_pracas)
                            ? dimensoes.sub_pracas.map((p: any) => ({ value: String(p), label: String(p) }))
                            : [];
                        setSubPracas(subPracasDoDashboard.filter((sp) => {
                            const subPracaValue = sp.value.toUpperCase();
                            return currentUser.assigned_pracas.some((praca) => {
                                const pracaValue = praca.toUpperCase();
                                return subPracaValue.includes(pracaValue) || subPracaValue.startsWith(pracaValue);
                            });
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
                    // Fallback completo em caso de erro na Promise.all
                    setSubPracas(processFallbackSubPracas(dimensoes, currentUser));
                    setTurnos(mapToOptions((dimensoes as any).turnos));
                    setOrigens(mapToOptions(dimensoes.origens));
                });
        } else {
            // Admin ou sem restrições
            setSubPracas(mapToOptions(dimensoes.sub_pracas));
            setTurnos(mapToOptions((dimensoes as any).turnos));
            setOrigens(mapToOptions(dimensoes.origens));
        }
    }, [dimensoes, currentUser]);

    return { subPracas, origens, turnos };
}

// Helpers
function mapToOptions(arr: any[]) {
    return Array.isArray(arr) ? arr.map(p => ({ value: String(p), label: String(p) })) : [];
}

function processFallbackSubPracas(dimensoes: DimensoesDashboard, currentUser: CurrentUser) {
    const all = mapToOptions(dimensoes.sub_pracas);
    return all.filter(sp => {
        const val = sp.value.toUpperCase();
        return currentUser.assigned_pracas.some(praca => {
            const pVal = praca.toUpperCase();
            return val.includes(pVal) || val.startsWith(pVal);
        });
    });
}
