import { Filters, CurrentUser, hasFullCityAccess } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { LIMITS, VALIDATION } from '@/constants/config';

const IS_DEV = process.env.NODE_ENV === 'development';

export const buildFilterPayload = (filters: Filters, currentUser?: CurrentUser | null, passedOrganizationId?: string | null) => {
    if (IS_DEV) {
        try {
            safeLog.info('[buildFilterPayload] Start', {
                mode: filters?.filtroModo,
                ano: filters?.ano,
                semana: filters?.semana
            });
        } catch (e) { /* ignore */ }
    }

    const { MAX_ARRAY_SIZE } = LIMITS;

    // Helper para processar strings/arrays
    const processArrayOrString = (arr: string[] | undefined | null, str: string | undefined | null): string[] | null => {
        if (arr && arr.length > 0) return arr.slice(0, MAX_ARRAY_SIZE);
        if (str && str.length > 0) return [str.substring(0, 100)];
        return null;
    };

    // Processar Inputs Básicos
    const p_sub_pracas = processArrayOrString(filters.subPracas, filters.subPraca);
    const p_origens = processArrayOrString(filters.origens, filters.origem);
    const p_turnos = processArrayOrString(filters.turnos, filters.turno);

    // Processar Ano/Semana
    let semana: number | null = null;
    if (filters.semanas?.length) semana = Number(filters.semanas[0]);
    else if (filters.semana != null) semana = Number(filters.semana);
    if (isNaN(semana!)) semana = null;

    let ano = filters.ano;
    if (ano !== null && (Number.isNaN(ano) || ano < VALIDATION.MIN_YEAR || ano > VALIDATION.MAX_YEAR)) {
        ano = null;
    }

    // Processar Datas (Modo Intervalo)
    let dataInicial: string | null = null;
    let dataFinal: string | null = null;

    if (filters?.filtroModo === 'intervalo') {
        const normalizeDate = (d: string | undefined | null) => {
            if (!d || !d.trim()) return null;
            const date = new Date(d);
            return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
        };

        dataInicial = normalizeDate(filters.dataInicial);
        dataFinal = normalizeDate(filters.dataFinal);

        if (dataInicial && dataFinal && dataFinal < dataInicial) dataFinal = dataInicial;
        if (dataInicial && !dataFinal) dataFinal = dataInicial;
        if (dataFinal && !dataInicial) dataInicial = dataFinal;

        if (dataFinal && !dataInicial) dataInicial = dataFinal;
        if (dataFinal && !dataInicial) dataInicial = dataFinal;

        ano = null;
        semana = null;
    } else {
        // Modo Ano/Semana
    }

    // Processar Praça e Permissões
    let praca = filters.praca?.trim() || null;
    if (praca && praca.length > LIMITS.MAX_PRACA_LENGTH) praca = praca.substring(0, LIMITS.MAX_PRACA_LENGTH);

    if (currentUser && !hasFullCityAccess(currentUser) && currentUser.assigned_pracas.length > 0) {
        if (currentUser.assigned_pracas.length === 1) {
            praca = currentUser.assigned_pracas[0];
        } else {
            // Se não selecionou ou selecionou inválida, usar todas permitidas
            if (!praca || !currentUser.assigned_pracas.includes(praca)) {
                const limited = currentUser.assigned_pracas.slice(0, MAX_ARRAY_SIZE);
                praca = limited.length === 1 ? limited[0] : limited.join(',');
            }
        }
    }

    const organizationId = passedOrganizationId !== undefined ? passedOrganizationId : (currentUser?.organization_id || null);

    const semanasFiltered = filters.semanas?.map(Number).filter(n => !isNaN(n));
    const p_semanas = (semanasFiltered && semanasFiltered.length > 0) ? semanasFiltered : null;

    return {
        p_ano: ano,
        p_semana: semana,
        p_semanas,
        p_praca: praca,
        p_sub_praca: null,
        p_origem: null,
        p_turno: null,
        p_sub_pracas,
        p_origens,
        p_turnos,
        p_filtro_modo: filters.filtroModo || 'ano_semana',
        p_data_inicial: dataInicial,
        p_data_final: dataFinal,
        p_organization_id: organizationId,
    } as const;
};
