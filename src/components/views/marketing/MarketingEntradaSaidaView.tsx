import React from 'react';
import { useMarketingData } from './useMarketingData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';
import { EntradaSaidaView } from './EntradaSaidaView';
import { useAuth } from '@/hooks/useAuth';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const MarketingEntradaSaidaView = React.memo(function MarketingEntradaSaidaView() {
    const {
        loading,
        error,
        filters,
        handleFilterChange
    } = useMarketingData();

    const { user } = useAuth();
    const [selectedWeek, setSelectedWeek] = React.useState<string | null>(null);

    // Gerar semanas do ano atual (da semana 1 até a atual)
    const weeks = React.useMemo(() => {
        const result = [];
        const today = new Date();
        const currentYear = today.getFullYear();

        // Começar do dia 1 de janeiro do ano atual
        const startDate = new Date(currentYear, 0, 1);

        // Encontrar a primeira segunda-feira ou o início da primeira semana ISO
        // Ajuste simples: iterar semana a semana até passar da data atual

        let currentWeekStart = new Date(startDate);
        // Ajustar para a primeira segunda-feira se necessário, ou usar lógica ISO
        // Para simplificar e garantir consistência com o backend (Postgres 'IW'), vamos usar uma biblioteca ou lógica robusta
        // Mas aqui vamos iterar:

        // Função auxiliar para obter número da semana ISO
        const getWeekNumber = (d: Date) => {
            const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            const dayNum = date.getUTCDay() || 7;
            date.setUTCDate(date.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
            return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        };

        // Começar um pouco antes para garantir que pegamos a semana 1
        let d = new Date(currentYear, 0, 1);

        // Se 1 de jan não for segunda, voltar para a segunda anterior para começar a semana completa
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // ajusta para segunda-feira
        d.setDate(diff);

        while (d <= today || getWeekNumber(d) === 1) { // Continua enquanto for menor que hoje ou se for a semana 1 (para garantir inicio)
            // Se passou do ano e não é semana 1, para.
            if (d.getFullYear() > currentYear && getWeekNumber(d) !== 1) break;

            const weekNum = getWeekNumber(d);

            // Se estamos no ano anterior mas é semana 52/53, ignorar se queremos apenas ano atual, 
            // mas ISO weeks podem cruzar anos. O usuário pediu "Semanas começarem na 01".
            // Vamos focar nas semanas que têm a maior parte no ano atual ou são do ano atual.

            const startOfWeek = new Date(d);
            const endOfWeek = new Date(d);
            endOfWeek.setDate(endOfWeek.getDate() + 6);

            // Format label
            const startStr = startOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            const endStr = endOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

            // Adicionar apenas se a semana pertencer majoritariamente ao ano atual ou se for a semana 1
            // O backend usa YYYY-"W"IW.
            // Vamos garantir que o ID bata com o que o backend espera/retorna se filtrarmos.
            // Mas o filtro de data é por DATA, não por ID de semana. O ID é só pra UI.

            // Evitar duplicatas e loops infinitos
            if (result.length > 0 && result[result.length - 1].id === `${currentYear}-W${weekNum}`) {
                d.setDate(d.getDate() + 7);
                continue;
            }

            // Só adiciona se o ano da semana ISO for o ano atual (ou se for a primeira semana que pode começar ano passado)
            // Simplificação: Mostrar todas as semanas que começam este ano até hoje.

            if (weekNum > 53) { // Safety break
                break;
            }

            result.push({
                id: `${currentYear}-W${weekNum}`,
                label: `Semana ${weekNum}`,
                subLabel: `${startStr} - ${endStr}`,
                start: startOfWeek.toISOString().split('T')[0],
                end: endOfWeek.toISOString().split('T')[0]
            });

            d.setDate(d.getDate() + 7);

            if (d > today) break;
        }

        // Inverter para mostrar a mais recente primeiro (opcional, mas comum em dashboards)
        // O usuário pediu "começar na 01", talvez queira ordem ascendente?
        // "As semanas deveriam começar na 01" -> sugere lista ordenada 1..N
        // Vamos ordenar ASC (1, 2, 3...)
        return result.sort((a, b) => {
            const wA = parseInt(a.id.split('W')[1]);
            const wB = parseInt(b.id.split('W')[1]);
            return wA - wB;
        });
    }, []);

    const handleWeekSelect = (weekId: string | null, start: string, end: string) => {
        if (!weekId) {
            setSelectedWeek(null);
            // Default: Ano atual completo
            const today = new Date();
            const startYear = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
            const endYear = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];

            handleFilterChange('filtroDataInicio', {
                dataInicial: startYear,
                dataFinal: endYear
            });
            return;
        }

        setSelectedWeek(weekId);
        handleFilterChange('filtroDataInicio', {
            dataInicial: start,
            dataFinal: end
        });
    };

    // Set default filter on mount if none exists
    React.useEffect(() => {
        if (!filters.filtroDataInicio.dataInicial && !selectedWeek) {
            const today = new Date();
            const startYear = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
            const endYear = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
            handleFilterChange('filtroDataInicio', {
                dataInicial: startYear,
                dataFinal: endYear
            });
        }
    }, []);

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
                    <p className="mt-4 text-lg font-semibold text-purple-700 dark:text-purple-200">Carregando dados...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="max-w-md mx-auto rounded-xl border border-rose-200 bg-white p-6 text-center shadow-xl dark:border-rose-900 dark:bg-slate-900">
                    <div className="text-4xl mb-4">⚠️</div>
                    <p className="text-lg font-bold text-rose-900 dark:text-rose-100">Erro ao carregar dados</p>
                    <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
                    >
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            {/* Filtros de Data - Apenas Data Início */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-500" />
                        <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-200">
                            Filtros de Data
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-6">
                    {/* Filtro de Semanas */}
                    <div className="w-full sm:w-72">
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Filtrar por Semana
                        </label>
                        <Select
                            value={selectedWeek || "all"}
                            onValueChange={(value) => {
                                if (value === "all") {
                                    handleWeekSelect(null, '', '');
                                } else {
                                    const week = weeks.find(w => w.id === value);
                                    if (week) {
                                        handleWeekSelect(week.id, week.start, week.end);
                                    }
                                }
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione uma semana" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as semanas (Personalizado)</SelectItem>
                                {weeks.map((week) => (
                                    <SelectItem key={week.id} value={week.id}>
                                        {week.label} ({week.subLabel})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filtro Manual (Escondido se semana selecionada) */}
                    {!selectedWeek && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                            <MarketingDateFilterComponent
                                label="Filtro de Data Início (Personalizado)"
                                filter={filters.filtroDataInicio}
                                onFilterChange={(filter) => {
                                    handleFilterChange('filtroDataInicio', filter);
                                }}
                            />
                        </div>
                    )}

                    {selectedWeek && (
                        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 animate-fade-in">
                            <span>📅 Filtro ativo: <strong>{weeks.find(w => w.id === selectedWeek)?.label}</strong> ({weeks.find(w => w.id === selectedWeek)?.subLabel})</span>
                            <button
                                onClick={() => {
                                    handleWeekSelect(null, '', '');
                                }}
                                className="ml-auto underline hover:text-blue-800 dark:hover:text-blue-200"
                            >
                                Limpar filtro
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Conteúdo Principal */}
            <EntradaSaidaView
                dataInicial={filters.filtroDataInicio.dataInicial}
                dataFinal={filters.filtroDataInicio.dataFinal}
                organizationId={user?.organization_id || undefined}
            />
        </div>
    );
});

MarketingEntradaSaidaView.displayName = 'MarketingEntradaSaidaView';

export default MarketingEntradaSaidaView;
