
import {
    COR_CINZA_CLARO,
    BORDA_RAIO_GRANDE,
} from '../../constants';
import {
    buildTurnoTitle,
    buildChartsColumns,
    buildVariationsColumns
} from './turnosCardHelpers';

export const criarCardTurno = (
    turno: {
        nome: string;
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
            buildTurnoTitle(turno.nome),
            buildChartsColumns(turno.semana1, turno.semana2, numeroSemana1, numeroSemana2),
            buildVariationsColumns(turno.variacoes),
        ],
        fillColor: COR_CINZA_CLARO,
        borderRadius: BORDA_RAIO_GRANDE,
        padding: [20, 15] as [number, number],
    };
};
