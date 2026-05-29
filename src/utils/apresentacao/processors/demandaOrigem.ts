import {
    calcularDiferenca,
    calcularDiferencaPercentual,
    formatarDiferenca,
    formatarDiferencaPercentual,
    formatarNumeroInteiro,
} from './common';
import { DadosBasicos } from './basicData';

export interface DemandaOrigemItem {
    nome: string;
    metricas: {
        label: string;
        icone: string;
        semana1Valor: string;
        semana2Valor: string;
        variacaoValor: string;
        variacaoPositiva: boolean;
        variacaoPercentual: string;
        variacaoPercentualPositiva: boolean;
    }[];
}

export const processarDemandaOrigem = (dadosBasicos: DadosBasicos): DemandaOrigemItem[] => {
    const { semana1, semana2 } = dadosBasicos;
    if (!semana1 || !semana2) return [];

    const origensSemana1 = semana1.aderencia_origem || semana1.origem || [];
    const origensSemana2 = semana2.aderencia_origem || semana2.origem || [];

    const origensSemana1Map = new Map(
        origensSemana1.map((item) => [(item.origem || '').trim(), item])
    );
    const origensSemana2Map = new Map(
        origensSemana2.map((item) => [(item.origem || '').trim(), item])
    );

    const todasOrigens = Array.from(
        new Set([...origensSemana1Map.keys(), ...origensSemana2Map.keys()])
    )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    return todasOrigens.map((origemNome) => {
        const o1 = origensSemana1Map.get(origemNome) || ({} as any);
        const o2 = origensSemana2Map.get(origemNome) || ({} as any);

        const campos = [
            { label: 'Ofertadas', icone: '📦', campo: 'corridas_ofertadas' as const },
            { label: 'Aceitas', icone: '🤝', campo: 'corridas_aceitas' as const },
            { label: 'Completadas', icone: '🏁', campo: 'corridas_completadas' as const },
            { label: 'Rejeitadas', icone: '⛔', campo: 'corridas_rejeitadas' as const },
        ];

        const metricas = campos.map(({ label, icone, campo }) => {
            const v1 = Number(o1[campo] ?? 0);
            const v2 = Number(o2[campo] ?? 0);
            const diff = calcularDiferenca(v1, v2);
            const diffPct = calcularDiferencaPercentual(v1 || 0.0001, v2 || 0);
            return {
                label,
                icone,
                semana1Valor: formatarNumeroInteiro(v1),
                semana2Valor: formatarNumeroInteiro(v2),
                variacaoValor: formatarDiferenca(diff),
                variacaoPositiva: diff >= 0,
                variacaoPercentual: formatarDiferencaPercentual(diffPct),
                variacaoPercentualPositiva: diffPct >= 0,
            };
        });

        return { nome: origemNome.toUpperCase(), metricas };
    });
};
