import { formatarHorasParaHMS } from '@/utils/formatters';
import { formatSignedInteger, formatSignedPercent } from '@/components/apresentacao/utils';

export const diasOrdem = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export const siglaDia = (dia: string) => dia.slice(0, 3).toUpperCase();

export const chunkArray = <T,>(array: T[], size: number): T[][] => {
    if (size <= 0) return [array];
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
};

export const formatarNumeroInteiro = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Number.isFinite(valor) ? valor : 0);

export const extrairNumeroSemana = (semana: string) => {
    if (semana?.includes('-W')) {
        return semana.split('-W')[1];
    }
    return semana;
};

export const calcularPeriodoSemana = (numeroSemana: string) => {
    const semanaNum = parseInt(numeroSemana, 10);
    if (Number.isNaN(semanaNum)) return '';
    const anoAtual = new Date().getFullYear();
    const primeiraSemana = new Date(anoAtual, 0, 1 + (semanaNum - 1) * 7);
    const primeiraDiaSemana = primeiraSemana.getDate() - primeiraSemana.getDay() + 1;
    const inicio = new Date(primeiraSemana.setDate(primeiraDiaSemana));
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    const formatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${formatter.format(inicio)} - ${formatter.format(fim)}`;
};

export const calcularDiferenca = (valor1: number, valor2: number) => valor2 - valor1;

export const formatarDiferenca = (diferenca: number, isTime: boolean = false) => {
    if (!Number.isFinite(diferenca)) {
        return isTime ? '0:00:00' : '0';
    }

    if (isTime) {
        const horas = Math.abs(diferenca);
        const prefix = diferenca > 0 ? '+' : diferenca < 0 ? '−' : '';
        return `${prefix}${formatarHorasParaHMS(horas.toString())}`;
    }

    if (diferenca === 0) {
        return '0';
    }

    return formatSignedInteger(diferenca);
};

export const calcularDiferencaPercentual = (valor1: number, valor2: number) => {
    if (!Number.isFinite(valor1) || valor1 === 0) return 0;
    return ((valor2 - valor1) / valor1) * 100;
};

export const formatarDiferencaPercentual = (diferenca: number) => {
    return formatSignedPercent(diferenca);
};
