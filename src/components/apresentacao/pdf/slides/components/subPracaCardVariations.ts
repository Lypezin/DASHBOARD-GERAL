import { COR_SUBTITULO, COR_VERDE, COR_VERMELHO } from '../../constants';
import { obterSeta } from '../../helpers';

export const buildVariationsColumns = (variacoes: Array<{ label: string; valor: string; positivo: boolean }>) => ({
    columns: variacoes.map((variacao) => ({
        width: '*',
        stack: [
            {
                text: variacao.label.toUpperCase(),
                fontSize: 8,
                color: COR_SUBTITULO,
                alignment: 'center',
                bold: true,
                characterSpacing: 0.3,
                margin: [0, 0, 0, 4] as [number, number, number, number],
            },
            {
                text: `${obterSeta(variacao.positivo)} ${variacao.valor}`,
                fontSize: 13,
                bold: true,
                color: variacao.positivo ? COR_VERDE : COR_VERMELHO,
                alignment: 'center',
            },
        ],
        fillColor: variacao.positivo ? '#ecfdf5' : '#fef2f2',
        borderRadius: 6,
        padding: [8, 6] as [number, number],
        margin: [2, 0] as [number, number],
    })),
    columnGap: 8,
});
