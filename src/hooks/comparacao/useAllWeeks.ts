import { useState, useEffect } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useAllWeeks(fallbackWeeks?: string[]) {
    const [todasSemanas, setTodasSemanas] = useState<(number | string)[]>([]);

    useEffect(() => {
        async function fetchTodasSemanas() {
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
        fetchTodasSemanas();
    }, [fallbackWeeks]);

    return todasSemanas;
}
