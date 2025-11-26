import React, { useState, useMemo } from 'react';
import { AderenciaSemanal, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { formatarHorasParaHMS, converterHorasParaDecimal } from '@/utils/formatters';
import { useTheme } from '@/contexts/ThemeContext';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Clock,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  ListChecks,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react';

const DashboardView = React.memo(function DashboardView({
  aderenciaGeral,
  aderenciaDia,
  aderenciaTurno,
  aderenciaSubPraca,
  aderenciaOrigem,
}: {
  aderenciaGeral?: AderenciaSemanal;
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
  aderenciaOrigem: AderenciaOrigem[];
}) {
  const [viewMode, setViewMode] = useState<'turno' | 'sub_praca' | 'origem'>('turno');
  const { theme } = useTheme();

  // Dados para renderização com base no viewMode
  const dataToRender = useMemo(() => {
    switch (viewMode) {
      case 'turno':
        return aderenciaTurno.map(item => ({
          label: item.turno || 'N/A',
          aderencia: item.aderencia_percentual || 0,
          horasAEntregar: item.horas_a_entregar || '0',
          horasEntregues: item.horas_entregues || '0'
        }));
      case 'sub_praca':
        return aderenciaSubPraca.map(item => ({
          label: item.sub_praca || 'N/A',
          aderencia: item.aderencia_percentual || 0,
          horasAEntregar: item.horas_a_entregar || '0',
          horasEntregues: item.horas_entregues || '0'
        }));
      case 'origem':
        return aderenciaOrigem.map(item => ({
          label: item.origem || 'N/A',
          aderencia: item.aderencia_percentual || 0,
          horasAEntregar: item.horas_a_entregar || '0',
          horasEntregues: item.horas_entregues || '0'
        }));
      default:
        return [];
    }
  }, [viewMode, aderenciaTurno, aderenciaSubPraca, aderenciaOrigem]);

  // Processar aderência por dia - converter data em dia da semana
  const aderenciaDiaOrdenada = useMemo(() => {
    const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    return [...aderenciaDia]
      .filter(dia => dia.data)
      .map(dia => {
        const dataObj = new Date(dia.data + 'T00:00:00');
        const diaDaSemana = diasDaSemana[dataObj.getDay()];
        const diaIso = dataObj.getDay() === 0 ? 7 : dataObj.getDay(); // ISO: 1=Segunda, 7=Domingo

        return {
          ...dia,
          dia_da_semana: diaDaSemana,
          dia_iso: diaIso
        };
      })
      .sort((a, b) => a.dia_iso - b.dia_iso);
  }, [aderenciaDia]);

  // Calcular gap de performance
  const calcularGap = useMemo(() => {
    if (!aderenciaGeral) return null;
    const planejadoStr = aderenciaGeral.horas_a_entregar || '0';
    const entregueStr = aderenciaGeral.horas_entregues || '0';

    const planejado = converterHorasParaDecimal(planejadoStr);
    const entregue = converterHorasParaDecimal(entregueStr);
    const gap = Math.max(0, planejado - entregue);

    return {
      horas: gap,
      formatado: formatarHorasParaHMS(gap)
    };
  }, [aderenciaGeral]);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Aderência Geral - Design Profissional Clean */}
      {aderenciaGeral && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Principal - Gráfico */}
          <Card className="lg:col-span-1 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4 text-slate-500" />
                  Aderência Geral
                </CardTitle>
                <Badge variant="outline" className="font-normal text-xs">
                  Consolidado
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="relative">
                <CircularProgress
                  value={aderenciaGeral.aderencia_percentual ?? 0}
                  size={200}
                  strokeWidth={16}
                  color={
                    (aderenciaGeral.aderencia_percentual ?? 0) >= 90
                      ? (theme === 'dark' ? '#10b981' : '#059669')
                      : (aderenciaGeral.aderencia_percentual ?? 0) >= 70
                        ? (theme === 'dark' ? '#3b82f6' : '#2563eb')
                        : (theme === 'dark' ? '#ef4444' : '#dc2626')
                  }
                  backgroundColor={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                  showLabel={true}
                  label="Total"
                />
              </div>
            </CardContent>
          </Card>

          {/* Cards de Métricas */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tempo Planejado */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Planejado</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  {formatarHorasParaHMS(aderenciaGeral.horas_a_entregar)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total de horas escaladas
                </p>
                <div className="mt-3 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-full opacity-60"></div>
                </div>
              </CardContent>
            </Card>

            {/* Tempo Entregue */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Entregue</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  {formatarHorasParaHMS(aderenciaGeral.horas_entregues)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total de horas realizadas
                </p>
                <div className="mt-3 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(((aderenciaGeral.aderencia_percentual ?? 0) / 100) * 100, 100)}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            {/* Gap de Performance */}
            {calcularGap && (
              <Card className="sm:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50/50 dark:bg-slate-900/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Gap de Performance</CardTitle>
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                      {calcularGap.formatado}
                    </div>
                    <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                      não entregues
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Diferença entre planejado e realizado
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Aderência por Dia da Semana */}
      {aderenciaDiaOrdenada.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-slate-500" />
              Performance Diária
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {aderenciaDiaOrdenada.map((dia, index) => {
              const aderencia = dia.aderencia_percentual || 0;
              const isToday = new Date().getDay() === (index + 1) % 7;

              const statusColor = aderencia >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                aderencia >= 70 ? 'text-blue-600 dark:text-blue-400' :
                  'text-rose-600 dark:text-rose-400';

              const barColor = aderencia >= 90 ? 'bg-emerald-500' :
                aderencia >= 70 ? 'bg-blue-500' :
                  'bg-rose-500';

              return (
                <Card
                  key={`dia-${index}`}
                  className={`border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 ${isToday ? 'ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-900/10' : ''
                    }`}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-between h-full min-h-[140px]">
                    <div className="text-center w-full">
                      <div className="flex items-center justify-center gap-1.5 mb-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                          {dia.dia_da_semana.substring(0, 3)}
                        </span>
                        {isToday && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></div>}
                      </div>

                      <div className={`text-2xl font-bold ${statusColor}`}>
                        {Math.round(aderencia)}%
                      </div>
                    </div>

                    <div className="w-full space-y-2 mt-3">
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full`}
                          style={{ width: `${Math.min(aderencia, 100)}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{formatarHorasParaHMS(dia.horas_entregues).split(':')[0]}h</span>
                        <span>/ {formatarHorasParaHMS(dia.horas_a_entregar).split(':')[0]}h</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Detalhamento Operacional */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <ListChecks className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Detalhamento Operacional</CardTitle>
                <CardDescription>Análise segmentada por categorias</CardDescription>
              </div>
            </div>

            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {(['turno', 'sub_praca', 'origem'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${viewMode === mode
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                  {mode === 'sub_praca' ? 'Sub Praça' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {dataToRender.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dataToRender.map((item, index) => {
                const statusColor = item.aderencia >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                  item.aderencia >= 70 ? 'text-blue-600 dark:text-blue-400' :
                    'text-rose-600 dark:text-rose-400';

                const barColor = item.aderencia >= 90 ? 'bg-emerald-500' :
                  item.aderencia >= 70 ? 'bg-blue-500' :
                    'bg-rose-500';

                const Icon = item.aderencia >= 70 ? TrendingUp : TrendingDown;

                return (
                  <div key={`${viewMode}-${index}`} className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate pr-2" title={item.label}>
                        {item.label}
                      </h3>
                      <Badge variant={item.aderencia >= 90 ? 'default' : item.aderencia >= 70 ? 'secondary' : 'destructive'} className="text-[10px] h-5 px-1.5 font-normal">
                        {item.aderencia.toFixed(1)}%
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-full ${item.aderencia >= 70 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                        <Icon className={`h-4 w-4 ${statusColor}`} />
                      </div>
                      <div className="flex-1">
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barColor} rounded-full`}
                            style={{ width: `${Math.min(item.aderencia, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex justify-between bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded">
                        <span>Plan:</span>
                        <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{formatarHorasParaHMS(item.horasAEntregar)}</span>
                      </div>
                      <div className="flex justify-between bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded">
                        <span>Real:</span>
                        <span className={`font-mono font-medium ${statusColor}`}>{formatarHorasParaHMS(item.horasEntregues)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Nenhum dado disponível</p>
              <p className="text-xs mt-1 opacity-70">
                Ajuste os filtros para visualizar os dados
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

DashboardView.displayName = 'DashboardView';

export default DashboardView;
