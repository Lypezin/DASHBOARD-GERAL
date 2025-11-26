import React, { useState, useMemo } from 'react';
import { AderenciaSemanal, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { formatarHorasParaHMS, getAderenciaColorHex, converterHorasParaDecimal } from '@/utils/formatters';
import { useTheme } from '@/contexts/ThemeContext';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Aderência Geral - Design Premium */}
      {aderenciaGeral && (
        <div className="relative group">
          {/* Glow effect sutil */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

          <Card className="relative border-0 shadow-2xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
            {/* Background Decorativo */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-emerald-500/5 to-teal-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

            <CardHeader className="relative pb-2 border-b border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-4 p-2">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-2xl">
                  📊
                </div>
                <div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Visão Geral de Aderência
                  </CardTitle>
                  <CardDescription className="text-base font-medium text-slate-500 dark:text-slate-400 mt-1">
                    Performance consolidada do período selecionado
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

                {/* Coluna Esquerda: Gráfico Circular */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                  <div className="relative">
                    {/* Glow atrás do gráfico */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl transform scale-110"></div>

                    <CircularProgress
                      value={aderenciaGeral.aderencia_percentual ?? 0}
                      size={280}
                      strokeWidth={24}
                      color={
                        (aderenciaGeral.aderencia_percentual ?? 0) >= 90
                          ? (theme === 'dark' ? '#10b981' : '#059669') // Verde
                          : (aderenciaGeral.aderencia_percentual ?? 0) >= 70
                            ? (theme === 'dark' ? '#3b82f6' : '#2563eb') // Azul
                            : (theme === 'dark' ? '#ef4444' : '#dc2626') // Vermelho
                      }
                      backgroundColor={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                      showLabel={true}
                      label="Aderência Total"
                    />
                  </div>
                </div>

                {/* Coluna Direita: Métricas e KPIs */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Card: Tempo Planejado */}
                    <div className="group/metric relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-2xl blur opacity-0 group-hover/metric:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tempo Planejado</p>
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            ⏱️
                          </div>
                        </div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                          {formatarHorasParaHMS(aderenciaGeral.horas_a_entregar)}
                        </p>
                        <div className="mt-4 h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full w-full opacity-50"></div>
                        </div>
                      </div>
                    </div>

                    {/* Card: Tempo Entregue */}
                    <div className="group/metric relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-200 to-emerald-300 dark:from-emerald-900 dark:to-emerald-800 rounded-2xl blur opacity-0 group-hover/metric:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-900/50 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Tempo Entregue</p>
                          <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            ✅
                          </div>
                        </div>
                        <p className="text-3xl font-black text-emerald-900 dark:text-emerald-100 font-mono tracking-tight">
                          {formatarHorasParaHMS(aderenciaGeral.horas_entregues)}
                        </p>
                        <div className="mt-4 h-2 w-full bg-emerald-200 dark:bg-emerald-900/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(((aderenciaGeral.aderencia_percentual ?? 0) / 100) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card: Gap de Performance (Destaque) */}
                  {calcularGap && (
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg text-white">
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
                      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-black/10 blur-xl"></div>

                      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                          <p className="text-blue-100 font-medium mb-1">Gap de Performance (Diferença)</p>
                          <div className="flex items-baseline gap-2">
                            <h3 className="text-4xl font-black font-mono tracking-tight">{calcularGap.formatado}</h3>
                            <span className="text-blue-200 text-sm font-medium">horas não entregues</span>
                          </div>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-inner">
                          📉
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Aderência por Dia da Semana - Grid Moderno */}
      {aderenciaDiaOrdenada.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="text-2xl">📅</span> Performance Diária
            </h3>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {aderenciaDiaOrdenada.map((dia, index) => {
              const aderencia = dia.aderencia_percentual || 0;
              const isToday = new Date().getDay() === (index + 1) % 7;

              // Cores dinâmicas baseadas na performance
              const statusColor = aderencia >= 90 ? 'emerald' : aderencia >= 70 ? 'blue' : 'rose';

              return (
                <div key={`dia-${index}`} className={`relative group transition-all duration-300 ${isToday ? 'scale-105 z-10' : 'hover:scale-105 hover:z-10'}`}>
                  {isToday && (
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur opacity-50"></div>
                  )}

                  <Card className={`h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${isToday ? 'bg-white dark:bg-slate-800 ring-2 ring-blue-500/20' : 'bg-white/80 dark:bg-slate-900/80'
                    }`}>
                    <div className={`h-1.5 w-full bg-${statusColor}-500`}></div>

                    <CardContent className="p-4 flex flex-col items-center text-center h-full justify-between">
                      <div className="mb-3">
                        <p className={`text-sm font-bold uppercase tracking-wider ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          {dia.dia_da_semana.substring(0, 3)}
                        </p>
                        {isToday && <Badge variant="secondary" className="text-[10px] h-4 px-1.5 mt-1">HOJE</Badge>}
                      </div>

                      <div className="relative mb-4">
                        <CircularProgress
                          value={aderencia}
                          size={70}
                          strokeWidth={8}
                          color={
                            aderencia >= 90 ? '#10b981' :
                              aderencia >= 70 ? '#3b82f6' :
                                '#f43f5e'
                          }
                          showLabel={false}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {Math.round(aderencia)}%
                          </span>
                        </div>
                      </div>

                      <div className="w-full space-y-1.5">
                        <div className="flex justify-between text-xs border-b border-slate-100 dark:border-slate-800 pb-1">
                          <span className="text-slate-400">Plan:</span>
                          <span className="font-mono font-medium">{formatarHorasParaHMS(dia.horas_a_entregar).split(':')[0]}h</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Real:</span>
                          <span className={`font-mono font-bold text-${statusColor}-600 dark:text-${statusColor}-400`}>
                            {formatarHorasParaHMS(dia.horas_entregues).split(':')[0]}h
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Aderência Detalhada - Tabela/Cards Modernos */}
      <div className="relative group pt-4">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-200 to-blue-200 dark:from-slate-800 dark:to-blue-900 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <Card className="relative border-0 shadow-xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
          <CardHeader className="relative pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl">
                  📋
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                    Detalhamento Operacional
                  </CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-400">
                    Análise segmentada por categorias
                  </CardDescription>
                </div>
              </div>

              {/* Botões de Filtro Estilizados */}
              <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                {(['turno', 'sub_praca', 'origem'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === mode
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm scale-105'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                  >
                    {mode === 'sub_praca' ? 'Sub Praça' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative p-6 bg-slate-50/30 dark:bg-slate-900/30">
            {dataToRender.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {dataToRender.map((item, index) => {
                  const statusColor = item.aderencia >= 90 ? 'emerald' : item.aderencia >= 70 ? 'blue' : 'rose';
                  const statusText = item.aderencia >= 90 ? 'Excelente' : item.aderencia >= 70 ? 'Bom' : item.aderencia >= 50 ? 'Médio' : 'Crítico';

                  return (
                    <div key={`${viewMode}-${index}`} className="group/card relative">
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl bg-${statusColor}-500 transition-all group-hover/card:w-2`}></div>

                      <Card className="relative border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 pl-3 overflow-hidden bg-white dark:bg-slate-800">
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate pr-2" title={item.label}>
                              {item.label}
                            </h3>
                            <Badge variant={statusColor === 'emerald' ? 'default' : statusColor === 'blue' ? 'secondary' : 'destructive'} className="shadow-none">
                              {statusText}
                            </Badge>
                          </div>

                          <div className="flex items-end gap-2 mb-4">
                            <span className={`text-3xl font-black text-${statusColor}-600 dark:text-${statusColor}-400`}>
                              {item.aderencia.toFixed(1)}%
                            </span>
                            <span className="text-sm text-slate-400 mb-1 font-medium">de aderência</span>
                          </div>

                          {/* Barra de Progresso Mini */}
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                            <div
                              className={`h-full bg-${statusColor}-500 rounded-full`}
                              style={{ width: `${Math.min(item.aderencia, 100)}%` }}
                            ></div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                              <p className="text-xs text-slate-400 uppercase font-semibold">Planejado</p>
                              <p className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatarHorasParaHMS(item.horasAEntregar)}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                              <p className="text-xs text-slate-400 uppercase font-semibold">Entregue</p>
                              <p className={`font-mono font-bold text-${statusColor}-600 dark:text-${statusColor}-400`}>{formatarHorasParaHMS(item.horasEntregues)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-4xl mb-4 text-slate-400">
                  📊
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Nenhum dado disponível</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2">
                  Tente ajustar os filtros ou selecionar outro modo de visualização.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

DashboardView.displayName = 'DashboardView';

export default DashboardView;
