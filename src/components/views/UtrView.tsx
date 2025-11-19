import React, { useMemo } from 'react';
import { UtrData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const UtrView = React.memo(function UtrView({
  utrData,
  loading,
}: {
  utrData: UtrData | null;
  loading: boolean;
}) {
  // Hooks devem ser chamados antes de qualquer early return
  // Usar os nomes corretos que vêm do backend (com fallback para compatibilidade)
  // Memoizar para evitar recálculo desnecessário
  const porPraca = useMemo(() => utrData?.praca || utrData?.por_praca || [], [utrData?.praca, utrData?.por_praca]);
  const porSubPraca = useMemo(() => utrData?.sub_praca || utrData?.por_sub_praca || [], [utrData?.sub_praca, utrData?.por_sub_praca]);
  const porOrigem = useMemo(() => utrData?.origem || utrData?.por_origem || [], [utrData?.origem, utrData?.por_origem]);
  const porTurno = useMemo(() => utrData?.turno || utrData?.por_turno || [], [utrData?.turno, utrData?.por_turno]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-lg font-semibold text-blue-700 dark:text-blue-200">Calculando UTR...</p>
        </div>
      </div>
    );
  }

  if (!utrData) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">Nenhum dado disponível</p>
      </div>
    );
  }

  // Verificar se geral existe antes de usar
  if (!utrData.geral) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">Dados incompletos - aguarde o carregamento</p>
      </div>
    );
  }

  const geral = utrData.geral;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* UTR Geral */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <Card className="relative border-0 shadow-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/30 rounded-3xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-blue-500/20 rounded-full blur-3xl"></div>
          
          <CardHeader className="relative pb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl">📏</span>
              </div>
              <div>
                <CardTitle className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  UTR Geral
                </CardTitle>
                <CardDescription className="text-base mt-1 text-blue-700/80 dark:text-blue-300/80">Taxa de Utilização de Recursos</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="relative group/card">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-blue-400 rounded-2xl blur opacity-0 group-hover/card:opacity-20 transition-opacity"></div>
                <div className="relative rounded-2xl bg-white/80 dark:bg-slate-800/80 p-6 shadow-lg backdrop-blur-sm">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Tempo Total</p>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{(geral.tempo_horas ?? 0).toFixed(2)}h</p>
                </div>
              </div>
              <div className="relative group/card">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-blue-400 rounded-2xl blur opacity-0 group-hover/card:opacity-20 transition-opacity"></div>
                <div className="relative rounded-2xl bg-white/80 dark:bg-slate-800/80 p-6 shadow-lg backdrop-blur-sm">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Corridas Completadas</p>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{(geral.corridas ?? 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="relative group/card">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-blue-400 rounded-2xl blur opacity-0 group-hover/card:opacity-20 transition-opacity"></div>
                <div className="relative rounded-2xl bg-white/80 dark:bg-slate-800/80 p-6 shadow-lg backdrop-blur-sm">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">UTR</p>
                  <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{(geral.utr ?? 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* UTR por Praça */}
      {porPraca && porPraca.length > 0 && (
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <Card className="relative border-0 shadow-xl bg-gradient-to-br from-white via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 rounded-3xl overflow-hidden">
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/5 to-blue-400/5 rounded-full blur-3xl"></div>
            
            <CardHeader className="relative pb-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🏢</span>
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                    UTR por Praça
                  </CardTitle>
                  <CardDescription className="text-base mt-1 text-slate-600 dark:text-slate-400">Análise por praça operacional</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="relative">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {porPraca.map((item) => (
                  <div key={item.praca} className="relative group/card">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-blue-400 rounded-2xl blur opacity-0 group-hover/card:opacity-20 transition-opacity"></div>
                    <Card className="relative border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-blue-950/20 rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl">
                      <CardContent className="pt-5 pb-4">
                        <p className="mb-4 text-base font-bold text-slate-900 dark:text-white">{item.praca}</p>
                        <div className="space-y-2.5 text-sm">
                          <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                            <span className="text-slate-600 dark:text-slate-400">Tempo:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{((item.tempo_horas ?? 0)).toFixed(2)}h</span>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                            <span className="text-slate-600 dark:text-slate-400">Corridas:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{item.corridas}</span>
                          </div>
                          <div className="flex justify-between items-center p-2.5 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <span className="font-bold text-blue-700 dark:text-blue-300">UTR:</span>
                            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{item.utr.toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* UTR por Sub-Praça */}
      {porSubPraca && porSubPraca.length > 0 && (
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <Card className="relative border-0 shadow-xl bg-gradient-to-br from-white via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 rounded-3xl overflow-hidden">
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/5 to-blue-400/5 rounded-full blur-3xl"></div>
            
            <CardHeader className="relative pb-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">📍</span>
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                    UTR por Sub-Praça
                  </CardTitle>
                  <CardDescription className="text-base mt-1 text-slate-600 dark:text-slate-400">Análise por sub-praça operacional</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="relative">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {porSubPraca.map((item) => (
                  <div key={item.sub_praca} className="relative group/card">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-blue-400 rounded-2xl blur opacity-0 group-hover/card:opacity-20 transition-opacity"></div>
                    <Card className="relative border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-blue-950/20 rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl">
                      <CardContent className="pt-5 pb-4">
                        <p className="mb-4 text-base font-bold text-slate-900 dark:text-white">{item.sub_praca}</p>
                        <div className="space-y-2.5 text-sm">
                          <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                            <span className="text-slate-600 dark:text-slate-400">Tempo:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{((item.tempo_horas ?? 0)).toFixed(2)}h</span>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                            <span className="text-slate-600 dark:text-slate-400">Corridas:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{item.corridas}</span>
                          </div>
                          <div className="flex justify-between items-center p-2.5 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <span className="font-bold text-blue-700 dark:text-blue-300">UTR:</span>
                            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{item.utr.toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* UTR por Origem */}
      {porOrigem && porOrigem.length > 0 && (
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <Card className="relative border-0 shadow-xl bg-gradient-to-br from-white via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 rounded-3xl overflow-hidden">
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/5 to-blue-400/5 rounded-full blur-3xl"></div>
            
            <CardHeader className="relative pb-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                    UTR por Origem
                  </CardTitle>
                  <CardDescription className="text-base mt-1 text-slate-600 dark:text-slate-400">Análise por origem operacional</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="relative">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {porOrigem.map((item) => (
                  <div key={item.origem} className="relative group/card">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-blue-400 rounded-2xl blur opacity-0 group-hover/card:opacity-20 transition-opacity"></div>
                    <Card className="relative border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-blue-950/20 rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl">
                      <CardContent className="pt-5 pb-4">
                        <p className="mb-4 text-base font-bold text-slate-900 dark:text-white">{item.origem}</p>
                        <div className="space-y-2.5 text-sm">
                          <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                            <span className="text-slate-600 dark:text-slate-400">Tempo:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{((item.tempo_horas ?? 0)).toFixed(2)}h</span>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                            <span className="text-slate-600 dark:text-slate-400">Corridas:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{item.corridas}</span>
                          </div>
                          <div className="flex justify-between items-center p-2.5 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <span className="font-bold text-blue-700 dark:text-blue-300">UTR:</span>
                            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{item.utr.toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* UTR por Turno */}
      {porTurno && porTurno.length > 0 && (
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <Card className="relative border-0 shadow-xl bg-gradient-to-br from-white via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 rounded-3xl overflow-hidden">
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/5 to-blue-400/5 rounded-full blur-3xl"></div>
            
            <CardHeader className="relative pb-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">⏰</span>
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                    UTR por Turno
                  </CardTitle>
                  <CardDescription className="text-base mt-1 text-slate-600 dark:text-slate-400">Análise por turno operacional</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="relative">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {porTurno.map((item) => (
                  <div key={item.turno || item.periodo} className="relative group/card">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-blue-400 rounded-2xl blur opacity-0 group-hover/card:opacity-20 transition-opacity"></div>
                    <Card className="relative border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-blue-950/20 rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl">
                      <CardContent className="pt-5 pb-4">
                        <p className="mb-4 text-base font-bold text-slate-900 dark:text-white">{item.turno || item.periodo || 'N/D'}</p>
                        <div className="space-y-2.5 text-sm">
                          <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                            <span className="text-slate-600 dark:text-slate-400">Tempo:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{((item.tempo_horas ?? 0)).toFixed(2)}h</span>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                            <span className="text-slate-600 dark:text-slate-400">Corridas:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{item.corridas}</span>
                          </div>
                          <div className="flex justify-between items-center p-2.5 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <span className="font-bold text-blue-700 dark:text-blue-300">UTR:</span>
                            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{item.utr.toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
});

UtrView.displayName = 'UtrView';

export default UtrView;
