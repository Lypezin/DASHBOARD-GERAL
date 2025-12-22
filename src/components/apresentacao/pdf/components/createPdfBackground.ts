import {
    A4_LANDSCAPE_HEIGHT,
    A4_LANDSCAPE_WIDTH,
    COR_BACKGROUND,
    COR_BACKGROUND_CAPA,
} from '../constants';

export const criarRetanguloFundo = (isCapa: boolean = false) => ({
    canvas: [
        {
            type: 'rect',
            x: 0,
            y: 0,
            w: A4_LANDSCAPE_WIDTH,
            h: A4_LANDSCAPE_HEIGHT,
            color: isCapa ? COR_BACKGROUND_CAPA : COR_BACKGROUND,
        },
    ],
    absolutePosition: { x: 0, y: 0 },
});
