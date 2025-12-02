/**
 * Traduz nome do mês para português
 */
export function translateMonth(mesNome: string): string {
    const meses: Record<string, string> = {
        'January': 'Janeiro',
        'February': 'Fevereiro',
        'March': 'Março',
        'April': 'Abril',
        'May': 'Maio',
        'June': 'Junho',
        'July': 'Julho',
        'August': 'Agosto',
        'September': 'Setembro',
        'October': 'Outubro',
        'November': 'Novembro',
        'December': 'Dezembro',
        'January ': 'Janeiro',
        'February ': 'Fevereiro',
        'March ': 'Março',
        'April ': 'Abril',
        'May ': 'Maio',
        'June ': 'Junho',
        'July ': 'Julho',
        'August ': 'Agosto',
        'September ': 'Setembro',
        'October ': 'Outubro',
        'November ': 'Novembro',
        'December ': 'Dezembro',
    };
    return meses[mesNome] || mesNome;
}

/**
 * Gera labels para visualização mensal
 * ⚠️ OTIMIZAÇÃO: Gera todos os 12 meses do ano, mesmo que não tenham dados
 */
export function generateMonthlyLabels(
    dados: Array<{ mes: number; mes_nome?: string; ano: number }>
): string[] {
    // Gerar todos os 12 meses do ano
    const mesesCompletos = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    return mesesCompletos.map(mes => translateMonth(mes));
}

/**
 * Gera labels para visualização semanal
 * ⚠️ OTIMIZAÇÃO: Gera todas as 53 semanas possíveis, mesmo que não tenham dados
 */
export function generateWeeklyLabels(
    dados: Array<{ semana: number; ano: number }>
): string[] {
    // Gerar todas as 53 semanas possíveis
    const semanasCompletas: string[] = [];
    for (let i = 1; i <= 53; i++) {
        semanasCompletas.push(`S${i.toString().padStart(2, '0')}`);
    }

    return semanasCompletas;
}
