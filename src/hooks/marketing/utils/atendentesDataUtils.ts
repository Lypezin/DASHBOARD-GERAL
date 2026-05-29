
import { AtendenteData } from '@/components/views/resultados/AtendenteCard';
import { CIDADES } from '@/constants/marketing';
import { ATENDENTES, ATENDENTES_FOTOS } from '@/utils/atendenteMappers';

export * from './atendentesFallback';

interface RpcItem {
    responsavel: string;
    enviado: number;
    liberado: number;
    cidade: string;
    cidade_enviado: number;
    cidade_liberado: number;
}

export const processRpcData = (rpcData: RpcItem[]): { atendentes: AtendenteData[]; totais: { totalEnviado: number; totalLiberado: number } } => {
    // Agrupar dados por atendente
    const atendentesMap = new Map<string, AtendenteData>();

    // Processar dados RPC
    for (const item of rpcData) {
        if (!atendentesMap.has(item.responsavel)) {
            atendentesMap.set(item.responsavel, {
                nome: item.responsavel,
                enviado: 0,
                liberado: 0,
                fotoUrl: ATENDENTES_FOTOS[item.responsavel] || null,
                cidades: [],
            });
        }

        const atendenteData = atendentesMap.get(item.responsavel)!;

        // Acumular totais
        atendenteData.enviado += item.enviado || 0;
        atendenteData.liberado += item.liberado || 0;

        if (item.cidade && (item.cidade_enviado > 0 || item.cidade_liberado > 0)) {
            atendenteData.cidades!.push({
                atendente: item.responsavel,
                cidade: item.cidade,
                enviado: item.cidade_enviado || 0,
                liberado: item.cidade_liberado || 0,
            });
        }
    }

    // Garantir que todos os atendentes estejam presentes e recalcular totais
    const atendentesDataArray: AtendenteData[] = ATENDENTES.map(atendente => {
        const data = atendentesMap.get(atendente);
        if (data) return data;
        return {
            nome: atendente,
            enviado: 0,
            liberado: 0,
            fotoUrl: ATENDENTES_FOTOS[atendente] || null,
            cidades: CIDADES.map(cidade => ({ atendente, cidade, enviado: 0, liberado: 0 })),
        };
    });

    const finalTotalEnviado = atendentesDataArray.reduce((acc, curr) => acc + curr.enviado, 0);
    const finalTotalLiberado = atendentesDataArray.reduce((acc, curr) => acc + curr.liberado, 0);

    return {
        atendentes: atendentesDataArray,
        totais: { totalEnviado: finalTotalEnviado, totalLiberado: finalTotalLiberado },
    };
};
