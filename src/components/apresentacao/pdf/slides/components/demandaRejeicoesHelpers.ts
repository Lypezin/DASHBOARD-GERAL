
import {
    COR_TEXTO,
    COR_VERDE,
    COR_VERMELHO,
    COR_CINZA_CLARO,
    COR_SUBTITULO,
} from '../../constants'; // Adjust path if needed, assumed to be in components/ folder relative to constants
import { obterSeta } from '../../helpers';

export const criarCardMetricaDemanda = (item: any, isSemana1: boolean) => ({
    stack: [
        {
            text: item.label.toUpperCase(),
            fontSize: 11,
            bold: true,
            color: COR_SUBTITULO,
            alignment: 'center',
            characterSpacing: 0.5,
            margin: [0, 0, 0, 8],
        },
        {
            text: isSemana1 ? item.semana1Valor : item.semana2Valor,
            fontSize: 28,
            bold: true,
            color: COR_TEXTO,
            alignment: 'center',
        },
    ],
    fillColor: COR_CINZA_CLARO,
    borderRadius: 12,
    padding: [15, 12],
    margin: [0, 0, 0, 12],
});

export const criarCardVariacaoDemanda = (item: any) => ({
    stack: [
        {
            text: item.label.toUpperCase(),
            fontSize: 10,
            color: COR_SUBTITULO,
            alignment: 'center',
            bold: true,
            characterSpacing: 0.5,
            margin: [0, 0, 0, 6],
        },
        // Valor com seta Unicode
        {
            text: `${obterSeta(item.variacaoPositiva)} ${item.variacaoValor}`,
            fontSize: 22,
            bold: true,
            color: item.variacaoPositiva ? COR_VERDE : COR_VERMELHO,
            alignment: 'center',
            margin: [0, 0, 0, 4],
        },
        // Percentual com seta Unicode
        {
            text: `${obterSeta(item.variacaoPercentualPositiva)} ${item.variacaoPercentual}`,
            fontSize: 16,
            bold: true,
            color: item.variacaoPercentualPositiva ? COR_VERDE : COR_VERMELHO,
            alignment: 'center',
        },
    ],
    fillColor: item.variacaoPositiva ? '#ecfdf5' : '#fef2f2',
    borderRadius: 10,
    padding: [15, 12],
    margin: [0, 0, 0, 12],
});
