import { useState, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { useSemanasComDados } from '@/hooks/useSemanasComDados';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Hook que retorna todas as semanas disponíveis para comparação.
 * Se um ano está selecionado, usa useSemanasComDados para buscar apenas semanas com dados.
 * Caso contrário, usa o fallback legado.
 */
export function useAllWeeks(fallbackWeeks?: string[], anoSelecionado?: number) {
    const [todasSemanas, setTodasSemanas] = useState<(number | string)[]>([]);

    // Usa o mesmo hook que o filtro principal usa
    const { semanasComDados, loadingSemanasComDados } = useSemanasComDados(anoSelecionado ?? null);

    useEffect(() => {
        // Se temos ano selecionado e semanas com dados, usar elas
        if (anoSelecionado && semanasComDados.length > 0) {
            // Ordena ascendente para visualização de comparação
            const ordenadas = [...semanasComDados].sort((a, b) => a - b);
            setTodasSemanas(ordenadas);
            return;
        }

        // Se temos ano selecionado mas ainda não carregou, aguardar
        if (anoSelecionado && loadingSemanasComDados) {
            return;
        }

        // Fallback: buscar todas as semanas sem filtro de ano
        async function fetchFallback() {
            try {
                const { data, error } = await safeRpc<any[]>('listar_todas_semanas', {}, {
                    timeout: 30000,
                    validateParams: false
                });

                if (error) {
                    if (IS_DEV) safeLog.error('Erro ao buscar semanas:', error);
                    if (fallbackWeeks && fallbackWeeks.length > 0) setTodasSemanas(fallbackWeeks);
                    return;
                }

                if (data) {
                    let semanasArray: unknown[] = [];

                    if (Array.isArray(data)) {
                        semanasArray = data;
                    } else if (data && typeof data === 'object') {
                        semanasArray = (data as any).listar_todas_semanas || (data as any).semanas || [];
                    }

                    let semanasProcessadas: (number | string)[] = [];

                    if (Array.isArray(semanasArray) && semanasArray.length > 0) {
                        if (typeof semanasArray[0] === 'object' && semanasArray[0] !== null) {
                            semanasProcessadas = (semanasArray as Record<string, unknown>[]).map((item) => {
                                if (item.ano && (item.semana || item.semana_numero)) {
                                    const s = item.semana || item.semana_numero;
                                    return `${item.ano}-W${s}`;
                                }
                                const semana = item.ano_semana || item.semana || item.semana_numero || item.numero_semana || String(item);
                                return typeof semana === 'number' ? semana : String(semana);
                            }).filter((s): s is string | number => Boolean(s));
                        } else {
                            semanasProcessadas = semanasArray.map((s: unknown) => String(s));
                        }
                    }

                    if (semanasProcessadas.length > 0) {
                        setTodasSemanas(semanasProcessadas);
                    } else if (fallbackWeeks && fallbackWeeks.length > 0) {
                        setTodasSemanas(fallbackWeeks);
                    }
                } else if (fallbackWeeks && fallbackWeeks.length > 0) {
                    setTodasSemanas(fallbackWeeks);
                }
            } catch (err) {
                if (IS_DEV) safeLog.error('Erro ao buscar semanas:', err);
                if (fallbackWeeks && fallbackWeeks.length > 0) {
                    setTodasSemanas(fallbackWeeks);
                }
            }
        }

        // Só busca fallback se não temos ano selecionado
        if (!anoSelecionado) {
            fetchFallback();
        }
    }, [fallbackWeeks, anoSelecionado, semanasComDados, loadingSemanasComDados]);

    return todasSemanas;
}
