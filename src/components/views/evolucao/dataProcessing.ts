import { EvolucaoMensal, EvolucaoSemanal } from '@/types';
import { generateMonthlyLabels, generateWeeklyLabels } from '@/utils/charts';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

/** Processa dados de evolução e cria estrutura para gráficos */
export const processEvolucaoData = (
    viewMode: 'mensal' | 'semanal',
    evolucaoMensal: EvolucaoMensal[],
    evolucaoSemanal: EvolucaoSemanal[],
    anoSelecionado: number
) => {
    const mensalArray = Array.isArray(evolucaoMensal) ? evolucaoMensal : [];
    const semanalArray = Array.isArray(evolucaoSemanal) ? evolucaoSemanal : [];

    // Filtrar e ordenar dados do ano selecionado
    const dadosAtivos = viewMode === 'mensal'
        ? [...mensalArray].filter(d => {
            if (!d) return false; return !isNaN(Number(d.ano)) && Number(d.ano) === Number(anoSelecionado);
        }).sort((a, b) => {
            const anoA = Number(a.ano), anoB = Number(b.ano);
            if (anoA !== anoB) return anoA - anoB;
            return Number(a.mes) - Number(b.mes);
        }) : [...semanalArray].filter(d => {
            if (!d) return false; return !isNaN(Number(d.ano)) && Number(d.ano) === Number(anoSelecionado);
        }).sort((a, b) => {
            const anoA = Number(a.ano), anoB = Number(b.ano);
            if (anoA !== anoB) return anoA - anoB;
            const semanaA = Number(a.semana), semanaB = Number(b.semana);
            if (isNaN(semanaA) || isNaN(semanaB)) return 0;
            return semanaA - semanaB;
        });

    // Gerar TODOS os labels (12 meses ou 53 semanas)
    const baseLabels = viewMode === 'mensal' ? generateMonthlyLabels([]) : generateWeeklyLabels([]);

    // Criar array de dados diretamente por índice
    const dadosPorLabel = new Map<string, any>();

    if (viewMode === 'mensal') {
        // Mapear por número do mês (1-12)
        const dadosPorMes = new Map<number, EvolucaoMensal>();
        dadosAtivos.forEach(d => {
            const mesRaw = (d as EvolucaoMensal).mes;
            const mes = typeof mesRaw === 'string' ? parseInt(mesRaw, 10) : Number(mesRaw);
            if (!isNaN(mes) && mes >= 1 && mes <= 12) dadosPorMes.set(mes, d as EvolucaoMensal);
        });

        // Preencher usando baseLabels para correspondência exata (Janeiro=1, Fevereiro=2, ...)
        baseLabels.forEach((label, index) => {
            const dados = dadosPorMes.get(index + 1);
            dadosPorLabel.set(label, dados ?? null);
        });

        if (IS_DEV) safeLog.info(`[processEvolucaoData] Mensal - Ano: ${anoSelecionado}, Total: ${dadosAtivos.length}`);
    } else {
        // Mapear por número da semana (1-53)
        const dadosPorSemana = new Map<number, EvolucaoSemanal>();
        dadosAtivos.forEach(d => {
            const semanaRaw = (d as EvolucaoSemanal).semana;
            const semana = typeof semanaRaw === 'string' ? parseInt(semanaRaw, 10) : Number(semanaRaw);
            if (!isNaN(semana) && semana >= 1 && semana <= 53) dadosPorSemana.set(semana, d as EvolucaoSemanal);
        });

        // Preencher todas as 53 semanas na ordem correta
        baseLabels.forEach((label, index) => {
            const semanaMatch = label.match(/^S(\d+)$/);
            if (semanaMatch) {
                const semana = Number(semanaMatch[1]);
                dadosPorLabel.set(label, dadosPorSemana.get(semana) ?? null);
            } else dadosPorLabel.set(label, null);
        });
    }

    return { dadosAtivos, baseLabels, dadosPorLabel };
};
