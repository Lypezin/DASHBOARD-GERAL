import { useEffect, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { supabase } from '@/lib/supabaseClient';
import { FilterOption, CurrentUser, hasFullCityAccess, DimensoesDashboard, Filters } from '@/types';

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

        let targetPracas: string[] = [];

        if (filters?.praca) {
            targetPracas = [filters.praca];
        } else if (currentUser && !hasFullCityAccess(currentUser) && currentUser.assigned_pracas.length > 0) {
            targetPracas = currentUser.assigned_pracas;
        }

        if (targetPracas.length > 0) {
            const fetchFromView = async () => {
                try {
                    const { data, error } = await supabase
                        .from('mv_aderencia_agregada')
                        .select('sub_praca, turno, origem')
                        .in('praca', targetPracas);

                    if (!error && data && data.length > 0) {
                        const uniqueSubs = Array.from(new Set(data.map((d: any) => d.sub_praca).filter(Boolean)));
                        const uniqueTurnos = Array.from(new Set(data.map((d: any) => d.turno).filter(Boolean)));
                        const uniqueOrigens = Array.from(new Set(data.map((d: any) => d.origem).filter(Boolean)));

                        setSubPracas(uniqueSubs.map(v => ({ value: String(v), label: String(v) })));
                        setTurnos(uniqueTurnos.length > 0 ? uniqueTurnos.map(v => ({ value: String(v), label: String(v) })) : []);
                        setOrigens(uniqueOrigens.map(v => ({ value: String(v), label: String(v) })));
                        return;
                    }
                } catch (e) {
                    if (IS_DEV) safeLog.warn('Failed to fetch dimension details from mv_aderencia_agregada', e);
                }

                setSubPracas(processFallbackSubPracas(dimensoes, targetPracas));
                setTurnos([]);
                setOrigens([]);
            };

            void fetchFromView();
            return;
        }

        setSubPracas(mapToOptions(dimensoes.sub_pracas));
        setTurnos(mapToOptions((dimensoes as any).turnos));
        setOrigens(mapToOptions(dimensoes.origens));
    }, [dimensoes, currentUser, filters?.praca]);

    return { subPracas, origens, turnos };
}

function mapToOptions(arr: any[]) {
    return Array.isArray(arr) ? arr.map(p => ({ value: String(p), label: String(p) })) : [];
}

function processFallbackSubPracas(dimensoes: DimensoesDashboard, activePracas: string[]) {
    return mapToOptions(dimensoes.sub_pracas).filter(sp => activePracas.some(praca => sp.value.toUpperCase().includes(praca.toUpperCase()) || sp.value.toUpperCase().startsWith(praca.toUpperCase())));
}
