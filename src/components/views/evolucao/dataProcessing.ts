import { EvolucaoMensal, EvolucaoSemanal } from '@/types';
import { generateMonthlyLabels, generateWeeklyLabels } from '@/utils/charts';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Processa dados de evolução e cria estrutura para gráficos
 * ⚠️ REFORMULAÇÃO COMPLETA: Garantir mapeamento correto por índice
 */
export const processEvolucaoData = (
    viewMode: 'mensal' | 'semanal',
    evolucaoMensal: EvolucaoMensal[],
    evolucaoSemanal: EvolucaoSemanal[],
    anoSelecionado: number
) => {
    const mensalArray = Array.isArray(evolucaoMensal) ? evolucaoMensal : [];
    const semanalArray = Array.isArray(evolucaoSemanal) ? evolucaoSemanal : [];

    // Filtrar e ordenar dados do ano selecionado
    // ⚠️ CORREÇÃO: Ser mais permissivo com tipos (string/number)
    const dadosAtivos = viewMode === 'mensal'
        ? [...mensalArray].filter(d => {
            if (!d) return false;
            const ano = Number(d.ano);
            return !isNaN(ano) && ano === Number(anoSelecionado);
        }).sort((a, b) => {
            const anoA = Number(a.ano);
            const anoB = Number(b.ano);
            if (anoA !== anoB) return anoA - anoB;

            const mesA = Number(a.mes);
            const mesB = Number(b.mes);
            return mesA - mesB;
        })
        : [...semanalArray]
            .filter(d => {
                if (!d) return false;
                const ano = Number(d.ano);
                return !isNaN(ano) && ano === Number(anoSelecionado);
            })
            .sort((a, b) => {
                const anoA = Number(a.ano);
                const anoB = Number(b.ano);
                if (anoA !== anoB) return anoA - anoB;

                const semanaA = Number(a.semana);
                const semanaB = Number(b.semana);
                if (isNaN(semanaA) || isNaN(semanaB)) return 0;
                return semanaA - semanaB;
            });

    // Gerar TODOS os labels (12 meses ou 53 semanas)
    const baseLabels = viewMode === 'mensal'
        ? generateMonthlyLabels([])
        : generateWeeklyLabels([]);

    // ⚠️ REFORMULAÇÃO: Criar array de dados diretamente por índice
    // Chart.js mapeia: data[0] -> labels[0], data[1] -> labels[1], etc.
    const dadosPorLabel = new Map<string, any>();

    if (viewMode === 'mensal') {
        // Mapear por número do mês (1-12)
        const dadosPorMes = new Map<number, EvolucaoMensal>();
        dadosAtivos.forEach(d => {
            const mesRaw = (d as EvolucaoMensal).mes;
            const mes = typeof mesRaw === 'string' ? parseInt(mesRaw, 10) : Number(mesRaw);
            if (!isNaN(mes) && mes >= 1 && mes <= 12) {
                dadosPorMes.set(mes, d as EvolucaoMensal);
            }
        });

        // ⚠️ CRÍTICO: Preencher usando baseLabels para garantir correspondência exata
        // baseLabels já contém os meses em português na ordem correta (Janeiro, Fevereiro, ..., Dezembro)
        // Cada label corresponde ao índice + 1 (Janeiro = índice 0 = mês 1, Fevereiro = índice 1 = mês 2, etc.)
        baseLabels.forEach((label, index) => {
            const mesNumero = index + 1; // Janeiro = 1, Fevereiro = 2, ..., Dezembro = 12
            const dados = dadosPorMes.get(mesNumero);
            dadosPorLabel.set(label, dados ?? null);
        });

        // ⚠️ DEBUG: Verificar mapeamento
        if (IS_DEV) {
            safeLog.info(`[processEvolucaoData] Mensal - Ano selecionado: ${anoSelecionado}`);
            safeLog.info(`[processEvolucaoData] Mensal - Total de dados recebidos: ${dadosAtivos.length}`);
        }
    } else {
        // ⚠️ CRÍTICO: Mapear por número da semana (1-53)
        const dadosPorSemana = new Map<number, EvolucaoSemanal>();
        dadosAtivos.forEach(d => {
            // ⚠️ CORREÇÃO: Garantir conversão correta do número da semana
            const semanaRaw = (d as EvolucaoSemanal).semana;
            const semana = typeof semanaRaw === 'string' ? parseInt(semanaRaw, 10) : Number(semanaRaw);
            if (!isNaN(semana) && semana >= 1 && semana <= 53) {
                dadosPorSemana.set(semana, d as EvolucaoSemanal);
            }
        });

        // ⚠️ CRÍTICO: Preencher todas as 53 semanas na ordem correta
        // Garantir que os labels gerados correspondam exatamente aos dados
        baseLabels.forEach((label, index) => {
            // Extrair número da semana do label (S01 -> 1, S02 -> 2, etc.)
            const semanaMatch = label.match(/^S(\d+)$/);
            if (semanaMatch) {
                const semana = Number(semanaMatch[1]);
                const dados = dadosPorSemana.get(semana);
                dadosPorLabel.set(label, dados ?? null);
            } else {
                // Fallback: se o label não seguir o padrão, usar null
                dadosPorLabel.set(label, null);
            }
        });
    }

    return { dadosAtivos, baseLabels, dadosPorLabel };
};
