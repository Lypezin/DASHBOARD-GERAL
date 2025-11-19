import React, { useState, useMemo } from 'react';
import { AderenciaSemanal, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import AderenciaCard from '../AderenciaCard';
import { formatarHorasParaHMS, formatarHorasCompacta, getAderenciaColor, getAderenciaBgColor, getAderenciaColorHex } from '@/utils/formatters';
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
          label: item.periodo || 'N/A',
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

  // Ordem dos dias da semana
  const diasDaSemanaOrdem = useMemo(() => ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'], []);
  
  const aderenciaDiaOrdenada = useMemo(() => {
    return [...aderenciaDia].sort((a, b) => {
      const indexA = diasDaSemanaOrdem.indexOf(a.dia_da_semana);
      const indexB = diasDaSemanaOrdem.indexOf(b.dia_da_semana);
      return indexA - indexB;
    });
  }, [aderenciaDia, diasDaSemanaOrdem]);

  // Calcular gap de performance
  const calcularGap = useMemo(() => {
    if (!aderenciaGeral) return null;
    const planejadoStr = aderenciaGeral.horas_a_entregar || '0';
    const entregueStr = aderenciaGeral.horas_entregues || '0';
    
    // Converter formato HH:MM:SS para horas decimais
    const parseHoras = (str: string | number): number => {
      if (typeof str === 'number') return str;
      if (!str || str === '0') return 0;
      
      // Se já for um número decimal (string)
      if (!str.includes(':')) {
        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
      }
      
      // Se for formato HH:MM:SS
      const parts = str.split(':');
      if (parts.length === 3) {
        const horas = parseInt(parts[0]) || 0;
        const minutos = parseInt(parts[1]) || 0;
        const segundos = parseInt(parts[2]) || 0;
        return horas + minutos / 60 + segundos / 3600;
      }
      
      return 0;
    };
    
    const planejado = parseHoras(planejadoStr);
    const entregue = parseHoras(entregueStr);
    const gap = Math.max(0, planejado - entregue);
    
    return {
      horas: gap,
      formatado: formatarHorasParaHMS(gap)
    };
  }, [aderenciaGeral]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Aderência Geral - Design Melhorado */}
      {aderenciaGeral && (
        <Card className="border-2 shadow-lg bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Aderência Geral</CardTitle>
            <CardDescription>Performance global do período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              {/* Gráfico Circular Central - Grande */}
              <div className="flex justify-center lg:justify-start order-2 lg:order-1">
                <div className="relative">
                  <CircularProgress
                    value={aderenciaGeral.aderencia_percentual ?? 0}
                    size={240}
                    strokeWidth={20}
                    color={getAderenciaColorHex(aderenciaGeral.aderencia_percentual ?? 0, theme === 'dark')}
                    backgroundColor="rgba(0, 0, 0, 0.08)"
                    showLabel={true}
                    label="Taxa Atual"
                  />
                </div>
              </div>

              {/* Cards de Métricas - Lado Direito */}
              <div className="space-y-4 order-1 lg:order-2">
                <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Tempo Planejado</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                      {formatarHorasCompacta(aderenciaGeral.horas_a_entregar)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-3">
                      {formatarHorasParaHMS(aderenciaGeral.horas_a_entregar)}
                    </p>
                    <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Tempo Entregue</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                      {formatarHorasCompacta(aderenciaGeral.horas_entregues)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-3">
                      {formatarHorasParaHMS(aderenciaGeral.horas_entregues)}
                    </p>
                    <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${Math.min(((aderenciaGeral.aderencia_percentual ?? 0) / 100) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gap de Performance - Card Destaque */}
              {calcularGap && (
                <Card className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md order-3">
                  <CardContent className="pt-6">
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3">Gap de Performance</p>
                    <p className="text-3xl sm:text-4xl font-bold text-blue-900 dark:text-blue-100 mb-2 font-mono">
                      {calcularGap.formatado}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-4">
                      Diferença entre planejado e entregue
                    </p>
                    {/* Indicador de variação */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                        <span className="text-xs font-semibold">+5.2%</span>
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aderência por Dia da Semana - Design Melhorado */}
      {aderenciaDiaOrdenada.length > 0 && (
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Aderência por Dia da Semana</CardTitle>
            <CardDescription>Distribuição semanal de performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              {aderenciaDiaOrdenada.map((dia, index) => {
                const aderencia = dia.aderencia_percentual || 0;
                const textColorHex = getAderenciaColorHex(aderencia, theme === 'dark');
                const isToday = new Date().getDay() === (index + 1) % 7;
                
                return (
                  <Card 
                    key={`dia-${index}`}
                    className={`border-2 transition-all hover:shadow-lg ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                    style={{ borderColor: textColorHex }}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-slate-900 dark:text-white">{dia.dia_da_semana}</h4>
                        <Badge 
                          className="text-white"
                          style={{ backgroundColor: textColorHex }}
                        >
                          {aderencia.toFixed(1)}%
                        </Badge>
                      </div>
                      
                      {/* Barra de progresso */}
                      <div className="mb-4">
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              backgroundColor: textColorHex,
                              width: `${Math.min(aderencia, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Dados */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400">Planejado:</span>
                          <span className="font-semibold text-slate-900 dark:text-white font-mono text-xs">
                            {formatarHorasParaHMS(dia.horas_a_entregar)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400">Entregue:</span>
                          <span 
                            className="font-semibold font-mono text-xs"
                            style={{ color: textColorHex }}
                          >
                            {formatarHorasParaHMS(dia.horas_entregues)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aderência Detalhada (Turno/Sub Praça/Origem) - Design Melhorado */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Aderência Detalhada</CardTitle>
              <CardDescription>Análise por segmento operacional</CardDescription>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              <button
                onClick={() => setViewMode('turno')}
                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === 'turno'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                Turno
              </button>
              <button
                onClick={() => setViewMode('sub_praca')}
                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === 'sub_praca'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                Sub Praça
              </button>
              <button
                onClick={() => setViewMode('origem')}
                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === 'origem'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                Origem
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dataToRender.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dataToRender.map((item, index) => {
                const statusColor = item.aderencia >= 90 ? 'emerald' : item.aderencia >= 70 ? 'amber' : 'rose';
                const statusText = item.aderencia >= 90 ? 'Excelente' : item.aderencia >= 70 ? 'Bom' : item.aderencia >= 50 ? 'Médio' : 'Crítico';
                
                return (
                  <Card key={`${viewMode}-${index}`} className="border-2 hover:shadow-lg transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{item.label}</h3>
                        <Badge 
                          variant="outline"
                          className={`${
                            statusColor === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' :
                            statusColor === 'amber' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700' :
                            'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                          }`}
                        >
                          {statusText}
                        </Badge>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-3xl font-bold mb-2" style={{ color: getAderenciaColorHex(item.aderencia, theme === 'dark') }}>
                          {item.aderencia.toFixed(1)}%
                        </p>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              backgroundColor: getAderenciaColorHex(item.aderencia, theme === 'dark'),
                              width: `${Math.min(item.aderencia, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Planejado:</span>
                          <span className="font-semibold text-slate-900 dark:text-white font-mono">
                            {formatarHorasParaHMS(item.horasAEntregar)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Entregue:</span>
                          <span 
                            className="font-semibold font-mono"
                            style={{ color: getAderenciaColorHex(item.aderencia, theme === 'dark') }}
                          >
                            {formatarHorasParaHMS(item.horasEntregues)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-slate-500 dark:text-slate-400">Nenhum dado disponível para este filtro</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

DashboardView.displayName = 'DashboardView';

export default DashboardView;
