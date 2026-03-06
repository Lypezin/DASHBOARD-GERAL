import { useState, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { FilterOption, CurrentUser, hasFullCityAccess, DimensoesDashboard, Filters } from '@/types';
import { RPC_TIMEOUTS } from '@/constants/config';
import { supabase } from '@/lib/supabaseClient';

const IS_DEV = process.env.NODE_ENV === 'development';

export function usePracaOptions(dimensoes: DimensoesDashboard | null, currentUser?: CurrentUser | null, filters?: Filters | null) {
    const [pracas, setPracas] = useState<FilterOption[]>([]);

    useEffect(() => {
        if (!dimensoes) {
            setPracas([]);
            return;
        }

        const fetchPracas = async () => {
            let pracasTotais: string[] = [];
            const selectedAno = filters?.ano;

            // Busca as praças diretamente do `dimensoes` se existir, e o `dashboard_resumo` costuma 
            // já retornar isso delimitado.
            if (dimensoes?.pracas && Array.isArray(dimensoes.pracas)) {
                // Se o usuário selecionou um ano, podemos usar as praças de dimensoes que já consideram o ano
                pracasTotais = dimensoes.pracas.map(String);
            }

            // Se ainda não temos pracas (fallback ou se dimensoes estiver vazio e sem ano)
            if (pracasTotais.length === 0) {
                if (currentUser && hasFullCityAccess(currentUser)) {
                    if (selectedAno) {
                        try {
                            const { data: dbPracas, error } = await safeRpc<any[]>('list_pracas_disponiveis', {}, {
                                timeout: RPC_TIMEOUTS.FAST,
                                validateParams: false
                            });
                            // Not filtering by year securely without a proper db table, so we fallback to all
                            if (!error && dbPracas) pracasTotais = dbPracas.map(p => p.praca || p).filter(Boolean);
                        } catch (err) {}
                    } else {
                        try {
                            const { data: pracasData, error: pracasError } = await safeRpc<any[]>('list_pracas_disponiveis', {}, {
                                timeout: RPC_TIMEOUTS.FAST,
                                validateParams: false
                            });
                            if (!pracasError && pracasData && pracasData.length > 0) {
                                pracasTotais = pracasData.map(p => p.praca || p).filter(Boolean);
                            }
                        } catch (err) {}
                    }
                } else if (currentUser?.assigned_pracas && currentUser.assigned_pracas.length > 0) {
                    pracasTotais = currentUser.assigned_pracas;
                }
            }

            // Filtro final para usuários restritos (Garantindo que a lista resultante intersecciona os acessos)
            if (currentUser && !hasFullCityAccess(currentUser)) {
                if (pracasTotais.length > 0) {
                    pracasTotais = pracasTotais.filter(p => currentUser.assigned_pracas.map(a => a.toUpperCase()).includes(p.toUpperCase()));
                } else {
                    pracasTotais = currentUser.assigned_pracas;
                }
            }

            const options = pracasTotais.map(p => ({ value: p, label: p }));
            setPracas(options);
        };

        fetchPracas();
    }, [dimensoes, currentUser, filters?.ano]);

    return pracas;
}
