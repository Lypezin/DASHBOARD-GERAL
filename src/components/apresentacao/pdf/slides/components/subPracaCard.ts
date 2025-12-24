
import {
    COR_CINZA_CLARO,
    BORDA_RAIO_GRANDE,
} from '../../constants';
import {
    buildTitleStack,
    buildPlannedBadge,
    buildChartsColumns,
    buildVariationsColumns
} from './subPracaCardHelpers';

export const criarCardSubPraca = (
    item: {
        nome: string;
        horasPlanejadas: string;
        semana1: { aderencia: number; horasEntregues: string };
        semana2: { aderencia: number; horasEntregues: string };
        variacoes: Array<{ label: string; valor: string; positivo: boolean }>;
    },
    numeroSemana1: string,
    numeroSemana2: string
) => {
    return {
        width: '*',
        stack: [
            buildTitleStack(item.nome),
            buildPlannedBadge(item.horasPlanejadas),
            buildChartsColumns(item.semana1, item.semana2, numeroSemana1, numeroSemana2),
            buildVariationsColumns(item.variacoes),
        ],
        fillColor: COR_CINZA_CLARO,
        borderRadius: BORDA_RAIO_GRANDE,
        padding: [20, 15] as [number, number],
    };
};
