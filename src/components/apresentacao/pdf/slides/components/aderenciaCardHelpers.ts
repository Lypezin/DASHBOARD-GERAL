
import { COR_SUBTITULO, COR_VERDE, COR_VERMELHO } from '../../constants';
import { obterSeta } from '../../helpers';

export const criarStackDiferencasAderencia = (diferencas: any) => {
    return {
        stack: [
            {
                text: 'VARIAÇÃO',
                fontSize: 8,
                color: COR_SUBTITULO,
                alignment: 'center',
                bold: true,
                characterSpacing: 0.3,
                margin: [0, 0, 0, 4],
            },
            // Seta + Valor de horas
            {
                text: `${obterSeta(diferencas.diferencaHorasPositiva)} ${diferencas.diferencaHoras}`,
                fontSize: 10,
                bold: true,
                color: diferencas.diferencaHorasPositiva ? COR_VERDE : COR_VERMELHO,
                alignment: 'center',
                margin: [0, 0, 0, 2],
            },
            // Seta + Percentual
            {
                text: `${obterSeta(diferencas.diferencaPercentualHorasPositiva)} ${diferencas.diferencaPercentualHoras}`,
                fontSize: 9,
                bold: true,
                color: diferencas.diferencaPercentualHorasPositiva ? COR_VERDE : COR_VERMELHO,
                alignment: 'center',
            },
        ],
        fillColor: diferencas.diferencaPercentualHorasPositiva ? '#ecfdf5' : '#fef2f2',
        borderRadius: 6,
        padding: [6, 5],
        margin: [4, 0, 4, 6],
    };
};
