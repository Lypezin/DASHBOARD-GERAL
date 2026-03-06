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
            const cacheKey = selectedAno ? `admin_pracas_cache_${selectedAno}` : null;

            // Tentativa de usar Cache por Ano (apenas para quem tem acesso total ou para interseção)
            if (cacheKey) {
                const cachedData = sessionStorage.getItem(cacheKey);
                if (cachedData) {
                    try {
                        const parsed = JSON.parse(cachedData);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            if (currentUser && !hasFullCityAccess(currentUser)) {
                                pracasTotais = parsed.filter(p => currentUser.assigned_pracas.map(a => a.toUpperCase()).includes(p.toUpperCase()));
                                setPracas(pracasTotais.map(p => ({ value: p, label: p })));
                                return;
                            } else {
                                setPracas(parsed.map((p: string) => ({ value: p, label: p })));
                                return;
                            }
                        }
                    } catch (e) {
                        // ignore error
                    }
                }
            }

            // Busca as praças apenas do Ano se ele estiver selecionado
            if (selectedAno) {
                try {
                    const { data: mvPracas, error: mvError } = await supabase
                        .from('mv_aderencia_agregada')
                        .select('praca')
                        .eq('ano', selectedAno)
                        .not('praca', 'is', null);

                    if (!mvError && mvPracas && mvPracas.length > 0) {
                        const uniquePracas = [...new Set(mvPracas.map(p => p.praca))].filter(Boolean) as string[];
                        if (cacheKey) {
                            sessionStorage.setItem(cacheKey, JSON.stringify(uniquePracas));
                        }

                        if (currentUser && !hasFullCityAccess(currentUser)) {
                            pracasTotais = uniquePracas.filter(p => currentUser.assigned_pracas.map(a => a.toUpperCase()).includes(p.toUpperCase()));
                        } else {
                            pracasTotais = uniquePracas;
                        }
                        
                        setPracas(pracasTotais.map(p => ({ value: p, label: p })));
                        return;
                    }
                } catch (err) {
                    if (IS_DEV) safeLog.warn('Erro ao buscar praças por ano via fallback MV:', err);
                }
            }

            // 1. Acesso total sem ano selecionado ou se falhou a busca por ano
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
    }, [dimensoes, currentUser, filters?.ano]);

    return pracas;
}
