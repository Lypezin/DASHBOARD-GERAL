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
    <div className="space-y-8 animate-fade-in">
      {/* Aderência Geral - Design Ultra Moderno */}
      {aderenciaGeral && (
        <div className="relative group">
          {/* Glow effect sutil azul */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <Card className="relative border-0 shadow-xl bg-gradient-to-br from-white via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 rounded-3xl overflow-hidden">
            {/* Decorative gradient overlay azul */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/5 to-blue-400/5 rounded-full blur-3xl"></div>
            
            <CardHeader className="relative pb-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                    Aderência Geral
                  </CardTitle>
                  <CardDescription className="text-base mt-1 text-slate-600 dark:text-slate-400">Performance global do período</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="relative">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                {/* Gráfico Circular Central - Grande com efeito glow azul */}
                <div className="flex justify-center lg:justify-start order-2 lg:order-1">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-500/20 rounded-full blur-2xl"></div>
                    <CircularProgress
                      value={aderenciaGeral.aderencia_percentual ?? 0}
                      size={260}
                      strokeWidth={22}
                      color={
                        (aderenciaGeral.aderencia_percentual ?? 0) >= 90 
                          ? (theme === 'dark' ? '#10b981' : '#059669') // Verde para bom
                          : (aderenciaGeral.aderencia_percentual ?? 0) >= 70
                          ? (theme === 'dark' ? '#3b82f6' : '#2563eb') // Azul para médio
                          : (theme === 'dark' ? '#ef4444' : '#dc2626') // Vermelho para ruim
                      }
                      backgroundColor="rgba(0, 0, 0, 0.06)"
                      showLabel={true}
                      label="Taxa Atual"
                    />
                  </div>
                </div>

                {/* Cards de Métricas - Lado Direito com design moderno */}
                <div className="space-y-5 order-1 lg:order-2">
                  <div className="relative group/card">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-blue-400 rounded-2xl blur opacity-0 group-hover/card:opacity-20 transition-opacity"></div>
                    <Card className="relative border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-blue-950/20 rounded-2xl overflow-hidden backdrop-blur-sm">
                      <CardContent className="pt-6 pb-5">
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide">Tempo Planejado</p>
                        <p className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
                          {formatarHorasCompacta(aderenciaGeral.horas_a_entregar)}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mb-4">
                          {formatarHorasParaHMS(aderenciaGeral.horas_a_entregar)}
                        </p>
                        <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 shadow-lg" style={{ width: '100%' }}></div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="relative group/card">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-blue-400 rounded-2xl blur opacity-0 group-hover/card:opacity-20 transition-opacity"></div>
                    <Card className="relative border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-blue-950/20 rounded-2xl overflow-hidden backdrop-blur-sm">
                      <CardContent className="pt-6 pb-5">
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide">Tempo Entregue</p>
                        <p className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
                          {formatarHorasCompacta(aderenciaGeral.horas_entregues)}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mb-4">
                          {formatarHorasParaHMS(aderenciaGeral.horas_entregues)}
                        </p>
                        <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 shadow-lg" 
                            style={{ 
                              width: `${Math.min(((aderenciaGeral.aderencia_percentual ?? 0) / 100) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Gap de Performance - Card Destaque com gradiente azul */}
                {calcularGap && (
                  <div className="relative order-3">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl blur opacity-30"></div>
                    <Card className="relative border-0 shadow-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/30 rounded-3xl overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-blue-500/20 rounded-full blur-2xl"></div>
                      <CardContent className="relative pt-8 pb-6">
                        <p className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-4 uppercase tracking-wider">Gap de Performance</p>
                        <p className="text-5xl font-black text-blue-900 dark:text-blue-100 mb-3 font-mono tracking-tight">
                          {calcularGap.formatado}
                        </p>
                        <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mb-5 font-medium">
                          Diferença entre planejado e entregue
                        </p>
                        {/* Indicador de variação */}
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-md px-3 py-1">
                            <span className="text-xs font-bold">+5.2%</span>
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Aderência por Dia da Semana - Design Ultra Moderno */}
      {aderenciaDiaOrdenada.length > 0 && (
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <Card className="relative border-0 shadow-xl bg-gradient-to-br from-white via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 rounded-3xl overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-blue-400/5 rounded-full blur-3xl"></div>
            
            <CardHeader className="relative pb-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">📅</span>
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                    Aderência por Dia da Semana
                  </CardTitle>
                  <CardDescription className="text-base mt-1 text-slate-600 dark:text-slate-400">Distribuição semanal de performance</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-5">
                {aderenciaDiaOrdenada.map((dia, index) => {
                  const aderencia = dia.aderencia_percentual || 0;
                  const isToday = new Date().getDay() === (index + 1) % 7;
                  
                  return (
                    <div key={`dia-${index}`} className="relative group/card">
                      <div className={`absolute -inset-0.5 rounded-2xl blur transition-all duration-300 ${
                        isToday 
                          ? 'bg-gradient-to-r from-blue-400 to-blue-500 opacity-60' 
                          : 'bg-gradient-to-r from-blue-300 to-blue-400 opacity-0 group-hover/card:opacity-20'
                      }`}></div>
                      
                      <Card 
                        className={`relative border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-blue-950/20 rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                          isToday ? 'ring-2 ring-blue-400/50' : ''
                        }`}
                      >
                        <CardContent className="pt-6 pb-5">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-lg text-slate-900 dark:text-white">{dia.dia_da_semana}</h4>
                            <Badge 
                              className="text-white shadow-md border-0 font-bold"
                              style={{ 
                                background: aderencia >= 90 
                                  ? `linear-gradient(135deg, #059669, #10b981)` // Verde para bom
                                  : aderencia >= 70
                                  ? `linear-gradient(135deg, #2563eb, #3b82f6)` // Azul para médio
                                  : `linear-gradient(135deg, #dc2626, #ef4444)` // Vermelho para ruim
                              }}
                            >
                              {aderencia.toFixed(1)}%
                            </Badge>
                          </div>
                          
                          {/* Barra de progresso moderna */}
                          <div className="mb-5">
                            <div className="h-4 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                              <div 
                                className="h-full rounded-full transition-all duration-700 shadow-lg"
                                style={{ 
                                  background: aderencia >= 90 
                                    ? `linear-gradient(90deg, #059669, #10b981)` // Verde para bom
                                    : aderencia >= 70
                                    ? `linear-gradient(90deg, #2563eb, #3b82f6)` // Azul para médio
                                    : `linear-gradient(90deg, #dc2626, #ef4444)`, // Vermelho para ruim
                                  width: `${Math.min(aderencia, 100)}%` 
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Dados */}
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">Planejado:</span>
                              <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                                {formatarHorasParaHMS(dia.horas_a_entregar)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">Entregue:</span>
                              <span 
                                className="font-bold font-mono text-xs"
                                style={{ 
                                  color: aderencia >= 90 
                                    ? (theme === 'dark' ? '#10b981' : '#059669') // Verde para bom
                                    : aderencia >= 70
                                    ? (theme === 'dark' ? '#3b82f6' : '#2563eb') // Azul para médio
                                    : (theme === 'dark' ? '#ef4444' : '#dc2626') // Vermelho para ruim
                                }}
                              >
                                {formatarHorasParaHMS(dia.horas_entregues)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Aderência Detalhada (Turno/Sub Praça/Origem) - Design Ultra Moderno */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <Card className="relative border-0 shadow-xl bg-gradient-to-br from-white via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 rounded-3xl overflow-hidden">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/5 to-blue-400/5 rounded-full blur-3xl"></div>
          
          <CardHeader className="relative pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                    Aderência Detalhada
                  </CardTitle>
                  <CardDescription className="text-base mt-1 text-slate-600 dark:text-slate-400">Análise por segmento operacional</CardDescription>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0">
                <button
                  onClick={() => setViewMode('turno')}
                  className={`shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    viewMode === 'turno'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
                      : 'bg-white text-slate-700 hover:bg-blue-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 hover:scale-105 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Turno
                </button>
                <button
                  onClick={() => setViewMode('sub_praca')}
                  className={`shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    viewMode === 'sub_praca'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
                      : 'bg-white text-slate-700 hover:bg-blue-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 hover:scale-105 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Sub Praça
                </button>
                <button
                  onClick={() => setViewMode('origem')}
                  className={`shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    viewMode === 'origem'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
                      : 'bg-white text-slate-700 hover:bg-blue-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 hover:scale-105 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Origem
                </button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative">
            {dataToRender.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dataToRender.map((item, index) => {
                  const statusColor = item.aderencia >= 90 ? 'emerald' : item.aderencia >= 70 ? 'blue' : 'red';
                  const statusText = item.aderencia >= 90 ? 'Excelente' : item.aderencia >= 70 ? 'Bom' : item.aderencia >= 50 ? 'Médio' : 'Crítico';
                  const colorHex = getAderenciaColorHex(item.aderencia, theme === 'dark');
                  
                  return (
                    <div key={`${viewMode}-${index}`} className="relative group/card">
                      <div className={`absolute -inset-0.5 rounded-2xl blur opacity-0 group-hover/card:opacity-30 transition-opacity ${
                        item.aderencia >= 90 
                          ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' // Verde para bom
                          : item.aderencia >= 70
                          ? 'bg-gradient-to-r from-blue-400 to-blue-500' // Azul para médio
                          : 'bg-gradient-to-r from-red-400 to-red-500' // Vermelho para ruim
                      }`}></div>
                      
                      <Card className="relative border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-blue-950/20 rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl">
                        <CardContent className="pt-6 pb-5">
                          <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-xl text-slate-900 dark:text-white">{item.label}</h3>
                            <Badge 
                              className={`font-bold border-0 shadow-md ${
                                statusColor === 'emerald' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' :
                                statusColor === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                                'bg-gradient-to-r from-red-500 to-red-600 text-white'
                              }`}
                            >
                              {statusText}
                            </Badge>
                          </div>
                          
                          <div className="mb-5">
                            <p 
                              className="text-4xl font-black mb-3 tracking-tight" 
                              style={{ 
                                color: item.aderencia >= 90 
                                  ? (theme === 'dark' ? '#10b981' : '#059669') // Verde para bom
                                  : item.aderencia >= 70
                                  ? (theme === 'dark' ? '#3b82f6' : '#2563eb') // Azul para médio
                                  : (theme === 'dark' ? '#ef4444' : '#dc2626') // Vermelho para ruim
                              }}
                            >
                              {item.aderencia.toFixed(1)}%
                            </p>
                            <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                              <div 
                                className="h-full rounded-full transition-all duration-700 shadow-lg"
                                style={{ 
                                  background: item.aderencia >= 90 
                                    ? `linear-gradient(90deg, #059669, #10b981)` // Verde para bom
                                    : item.aderencia >= 70
                                    ? `linear-gradient(90deg, #2563eb, #3b82f6)` // Azul para médio
                                    : `linear-gradient(90deg, #dc2626, #ef4444)`, // Vermelho para ruim
                                  width: `${Math.min(item.aderencia, 100)}%` 
                                }}
                              ></div>
                            </div>
                          </div>

                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                              <span className="text-slate-500 dark:text-slate-400 font-semibold">Planejado:</span>
                              <span className="font-bold text-slate-900 dark:text-white font-mono">
                                {formatarHorasParaHMS(item.horasAEntregar)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                              <span className="text-slate-500 dark:text-slate-400 font-semibold">Entregue:</span>
                              <span 
                                className="font-bold font-mono"
                                style={{ 
                                  color: item.aderencia >= 90 
                                    ? (theme === 'dark' ? '#10b981' : '#059669') // Verde para bom
                                    : item.aderencia >= 70
                                    ? (theme === 'dark' ? '#3b82f6' : '#2563eb') // Azul para médio
                                    : (theme === 'dark' ? '#ef4444' : '#dc2626') // Vermelho para ruim
                                }}
                              >
                                {formatarHorasParaHMS(item.horasEntregues)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-7xl mb-6 opacity-50">📊</div>
                <p className="text-slate-500 dark:text-slate-400 text-lg">Nenhum dado disponível para este filtro</p>
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
