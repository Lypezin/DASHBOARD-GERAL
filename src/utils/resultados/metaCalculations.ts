export const META_CUSTO = 50;

export interface MetaInfo {
    faltamLiberados: number;
    jaAtingiuMeta: boolean;
}

export const calcularMetaInfo = (custoPorLiberado?: number, quantidadeLiberados?: number, valorTotal?: number): MetaInfo | null => {
    if (!custoPorLiberado || custoPorLiberado <= 0) return null;

    let faltamLiberados = 0;
    let jaAtingiuMeta = false;

    if (custoPorLiberado > META_CUSTO && quantidadeLiberados && quantidadeLiberados > 0) {
        faltamLiberados = Math.ceil((valorTotal! - META_CUSTO * quantidadeLiberados) / META_CUSTO);
        if (faltamLiberados < 0) {
            faltamLiberados = 0;
        }
    } else if (custoPorLiberado <= META_CUSTO && custoPorLiberado > 0) {
        jaAtingiuMeta = true;
    }

    return { faltamLiberados, jaAtingiuMeta };
};
