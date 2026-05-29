import {
    calcularDiferenca,
    calcularDiferencaPercentual,
    formatarDiferenca,
    formatarDiferencaPercentual,
    formatarNumeroInteiro,
} from './common';
import { DadosBasicos } from './basicData';

export const processarDemanda = (dadosBasicos: DadosBasicos) => {
    const { semana1, semana2 } = dadosBasicos;
    if (!semana1 || !semana2) return [];

    return [
        {
            label: 'Ofertadas',
            icone: '📦',
            valor1: Number(semana1.total_ofertadas || 0),
            valor2: Number(semana2.total_ofertadas || 0),
        },
        {
            label: 'Aceitas',
            icone: '🤝',
            valor1: Number(semana1.total_aceitas || 0),
            valor2: Number(semana2.total_aceitas || 0),
        },
        {
            label: 'Completadas',
            icone: '🏁',
            valor1: Number(semana1.total_completadas || 0),
            valor2: Number(semana2.total_completadas || 0),
        },
        {
            label: 'Rejeitadas',
            icone: '⛔',
            valor1: Number(semana1.total_rejeitadas || 0),
            valor2: Number(semana2.total_rejeitadas || 0),
        },
    ].map((item) => {
        const diffValor = calcularDiferenca(item.valor1, item.valor2);
        const diffPercent = calcularDiferencaPercentual(item.valor1 || 0.0001, item.valor2 || 0);
        return {
            label: item.label,
            icone: item.icone,
            semana1Valor: formatarNumeroInteiro(item.valor1),
            semana2Valor: formatarNumeroInteiro(item.valor2),
            variacaoValor: formatarDiferenca(diffValor),
            variacaoPositiva: diffValor >= 0,
            variacaoPercentual: formatarDiferencaPercentual(diffPercent),
            variacaoPercentualPositiva: diffPercent >= 0,
        };
    });
};
