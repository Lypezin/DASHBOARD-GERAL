import { DashboardFilters } from '@/types/filters';

export function getActivityDescription(
    action_type: string,
    action_details: Record<string, unknown> | string,
    tab_name: string | null,
    filters_applied: DashboardFilters | Record<string, unknown>
): string {
    let descricaoDetalhada = '';
    const tabNames: Record<string, string> = {
        dashboard: 'Dashboard',
        analise: 'Análise Detalhada',
        comparacao: 'Comparação',
        utr: 'UTR',
        entregadores: 'Entregadores',
        valores: 'Valores',
        prioridade: 'Prioridade/Promo',
        evolucao: 'Evolução'
    };
    const nomeAba = (tab_name && tabNames[tab_name]) || tab_name || 'Desconhecida';

    switch (action_type) {
        case 'filter_change':
            const filtros: string[] = [];
            const filtersObj = filters_applied as Record<string, unknown>;
            if (filtersObj.semana) filtros.push(`Semana ${filtersObj.semana}`);
            if (filtersObj.praca) filtros.push(`Praça: ${filtersObj.praca}`);
            if (filtersObj.sub_praca || filtersObj.subPraca) filtros.push(`Sub-Praça: ${filtersObj.sub_praca || filtersObj.subPraca}`);
            if (filtersObj.origem) filtros.push(`Origem: ${filtersObj.origem}`);
            if (filtersObj.turno) filtros.push(`Turno: ${filtersObj.turno}`);

            if (filtros.length > 0) {
                descricaoDetalhada = `Filtrou: ${filtros.join(', ')} na aba ${nomeAba}`;
            } else {
                descricaoDetalhada = `Limpou filtros na aba ${nomeAba}`;
            }
            break;
        case 'tab_change':
            descricaoDetalhada = `Acessou a aba ${nomeAba}`;
            break;
        case 'login':
            descricaoDetalhada = 'Fez login no sistema';
            break;
        case 'heartbeat':
            descricaoDetalhada = `Navegando na aba ${nomeAba}`;
            break;
        case 'page_visible':
            descricaoDetalhada = `Voltou para a aba ${nomeAba}`;
            break;
        case 'page_hidden':
            descricaoDetalhada = `Saiu da aba ${nomeAba}`;
            break;
        default:
            descricaoDetalhada = typeof action_details === 'string' ? action_details : `${action_type} na aba ${nomeAba}`;
    }

    return descricaoDetalhada;
}
