import { useState, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useAllWeeks(fallbackWeeks?: string[], anoSelecionado?: number) {
    const [todasSemanas, setTodasSemanas] = useState<(number | string)[]>([]);

    useEffect(() => {
        async function fetchTodasSemanas() {
            try {
                // Se temos ano selecionado, usar a nova RPC otimizada
                if (anoSelecionado) {
                    const { data, error } = await safeRpc<any[]>('get_semanas_data_v2', {
                        ano_param: anoSelecionado
                    });

                    if (error) {
                        if (IS_DEV) safeLog.error('Erro ao buscar semanas do ano:', error);
                        if (fallbackWeeks && fallbackWeeks.length > 0) setTodasSemanas(fallbackWeeks);
                        return;
                    }

                    if (data && Array.isArray(data)) {
                        // Processar datas para extrair semanas (logica igual ao useSemanasComDados)
                        const semanasDoAno = data
                            .map((row: any) => {
                                if (!row.data_do_periodo) return null;
                                // Parse manual da data
                                const parts = row.data_do_periodo.split('-');
                                const year = parseInt(parts[0], 10);
                                const month = parseInt(parts[1], 10);
                                const day = parseInt(parts[2], 10);

                                const date = new Date(year, month - 1, day);
                                const dateYear = date.getFullYear();

                                // Garantir que é do ano certo (embora a RPC já filtre)
                                if (dateYear !== anoSelecionado) return null;

                                // Calcula semana ISO
                                const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                                const dayNum = d.getUTCDay() || 7;
                                d.setUTCDate(d.getUTCDate() + 4 - dayNum);
                                const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                                const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
                                return weekNo;
                            })
                            .filter((s): s is number => typeof s === 'number' && !isNaN(s));

                        const semanasUnicas = [...new Set(semanasDoAno)].sort((a, b) => a - b); // Ascendente para comparação viz
                        setTodasSemanas(semanasUnicas);
                    }
                    return;
                }

                // Fallback legado: listar todas as semanas (sem filtro de ano)
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
        fetchTodasSemanas();
    }, [fallbackWeeks, anoSelecionado]);

    return todasSemanas;
}
