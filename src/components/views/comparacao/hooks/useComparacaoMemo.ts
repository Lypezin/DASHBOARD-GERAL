
import { useMemo } from 'react';

export function useComparacaoMemo(
    dadosComparacao: any[],
    semanasSelecionadas: string[],
    utrComparacao: any[]
) {
    const origensDisponiveis = useMemo(() => {
        const conjunto = new Set<string>();
        dadosComparacao.forEach((dados) => {
            const origens = dados?.aderencia_origem || dados?.origem || [];
            origens.forEach((item: any) => {
                const nome = item?.origem?.trim();
                if (nome) {
                    conjunto.add(nome);
                }
            });
        });
        return Array.from(conjunto).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }, [dadosComparacao]);

    const totalColunasOrigem = useMemo(
        () => semanasSelecionadas.reduce((acc, _, idx) => acc + (idx === 0 ? 1 : 2), 0),
        [semanasSelecionadas]
    );

    const utrComparacaoNormalizada = useMemo(() => {
        return utrComparacao.map(item => ({
            semana: String(item.semana),
            utr: item.utr,
        }));
    }, [utrComparacao]);

    return {
        origensDisponiveis,
        totalColunasOrigem,
        utrComparacaoNormalizada
    };
}
