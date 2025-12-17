import { useState, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { FilterOption, CurrentUser, hasFullCityAccess, DimensoesDashboard } from '@/types';
import { RPC_TIMEOUTS } from '@/constants/config';

const IS_DEV = process.env.NODE_ENV === 'development';

export function usePracaOptions(dimensoes: DimensoesDashboard | null, currentUser?: CurrentUser | null) {
    const [pracas, setPracas] = useState<FilterOption[]>([]);

    useEffect(() => {
        if (!dimensoes) {
            setPracas([]);
            return;
        }

        const fetchPracas = async () => {
            let pracasTotais: string[] = [];

            // 1. Acesso total
            if (currentUser && hasFullCityAccess(currentUser)) {
                try {
                    const { data: pracasData, error: pracasError } = await safeRpc<any[]>('list_pracas_disponiveis', {}, {
                        timeout: RPC_TIMEOUTS.FAST,
                        validateParams: false
                    });

                    if (!pracasError && pracasData && pracasData.length > 0) {
                        pracasTotais = pracasData.map(p => p.praca || p).filter(Boolean);
                    } else {
                        pracasTotais = Array.isArray(dimensoes?.pracas) ? dimensoes!.pracas.map(String) : [];
                    }
                } catch (err) {
                    if (IS_DEV) safeLog.warn('Erro ao buscar praças via RPC:', err);
                    pracasTotais = Array.isArray(dimensoes?.pracas) ? dimensoes!.pracas.map(String) : [];
                }
            }
            // 2. Acesso restrito
            else if (currentUser?.assigned_pracas && currentUser.assigned_pracas.length > 0) {
                pracasTotais = currentUser.assigned_pracas;
            }
            // 3. Fallback
            else if (dimensoes?.pracas) {
                pracasTotais = Array.isArray(dimensoes.pracas) ? dimensoes.pracas.map(String) : [];
            }

            const options = pracasTotais.map(p => ({ value: p, label: p }));
            setPracas(options);
        };

        fetchPracas();
    }, [dimensoes, currentUser]);

    return pracas;
}
