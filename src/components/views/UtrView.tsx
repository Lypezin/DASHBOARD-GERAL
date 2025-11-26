import React, { useMemo } from 'react';
import { UtrData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Gauge,
  Building2,
  MapPin,
  Target,
  Clock,
  Timer,
  Car,
  Activity
} from 'lucide-react';

const UtrView = React.memo(function UtrView({
  utrData,
  loading,
}: {
  utrData: UtrData | null;
  loading: boolean;
}) {
  // Hooks devem ser chamados antes de qualquer early return
  const porPraca = useMemo(() => utrData?.praca || utrData?.por_praca || [], [utrData?.praca, utrData?.por_praca]);
  const porSubPraca = useMemo(() => utrData?.sub_praca || utrData?.por_sub_praca || [], [utrData?.sub_praca, utrData?.por_sub_praca]);
  const porOrigem = useMemo(() => utrData?.origem || utrData?.por_origem || [], [utrData?.origem, utrData?.por_origem]);
  const porTurno = useMemo(() => utrData?.turno || utrData?.por_turno || [], [utrData?.turno, utrData?.por_turno]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <p className="mt-4 text-sm font-medium text-slate-500">Calculando UTR...</p>
        </div>
      </div>
    );
  }

  if (!utrData || !utrData.geral) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl border-dashed border-slate-300 dark:border-slate-700">
        <Activity className="h-10 w-10 text-slate-400 mb-3" />
        <p className="text-lg font-medium text-slate-900 dark:text-white">Nenhum dado disponível</p>
        <p className="text-sm text-slate-500">Aguarde o carregamento ou ajuste os filtros.</p>
      </div>
    );
  }

  const geral = utrData.geral;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* UTR Geral */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Gauge className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                UTR Geral
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Taxa de Utilização de Recursos consolidada
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Tempo Total */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-500">Tempo Total</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {(geral.tempo_horas ?? 0).toFixed(2)}h
              </p>
            </div>

            {/* Corridas */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Car className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-500">Corridas</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {(geral.corridas ?? 0).toLocaleString()}
              </p>
            </div>

            {/* UTR Score */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-900/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Score UTR</span>
              </div>
              <p className="text-3xl font-black text-blue-700 dark:text-blue-300 font-mono">
                {(geral.utr ?? 0).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UTR por Praça */}
      {porPraca && porPraca.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">UTR por Praça</CardTitle>
                <CardDescription>Análise por praça operacional</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {porPraca.map((item) => (
                <div key={item.praca} className="group relative rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate pr-2" title={item.praca}>
                      {item.praca}
                    </h3>
                    <div className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold font-mono">
                      {item.utr.toFixed(2)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Timer className="h-3 w-3" />
                      <span>{((item.tempo_horas ?? 0)).toFixed(1)}h</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Car className="h-3 w-3" />
                      <span>{item.corridas}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* UTR por Sub-Praça */}
      {porSubPraca && porSubPraca.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <MapPin className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">UTR por Sub-Praça</CardTitle>
                <CardDescription>Análise por sub-praça operacional</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {porSubPraca.map((item) => (
                <div key={item.sub_praca} className="group relative rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate pr-2" title={item.sub_praca}>
                      {item.sub_praca}
                    </h3>
                    <div className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold font-mono">
                      {item.utr.toFixed(2)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Timer className="h-3 w-3" />
                      <span>{((item.tempo_horas ?? 0)).toFixed(1)}h</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Car className="h-3 w-3" />
                      <span>{item.corridas}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* UTR por Origem */}
      {porOrigem && porOrigem.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Target className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">UTR por Origem</CardTitle>
                <CardDescription>Análise por origem operacional</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {porOrigem.map((item) => (
                <div key={item.origem} className="group relative rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate pr-2" title={item.origem}>
                      {item.origem}
                    </h3>
                    <div className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold font-mono">
                      {item.utr.toFixed(2)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Timer className="h-3 w-3" />
                      <span>{((item.tempo_horas ?? 0)).toFixed(1)}h</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Car className="h-3 w-3" />
                      <span>{item.corridas}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* UTR por Turno */}
      {porTurno && porTurno.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">UTR por Turno</CardTitle>
                <CardDescription>Análise por turno operacional</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {porTurno.map((item) => (
                <div key={item.turno || item.periodo} className="group relative rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate pr-2" title={item.turno || item.periodo}>
                      {item.turno || item.periodo || 'N/D'}
                    </h3>
                    <div className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold font-mono">
                      {item.utr.toFixed(2)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Timer className="h-3 w-3" />
                      <span>{((item.tempo_horas ?? 0)).toFixed(1)}h</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Car className="h-3 w-3" />
                      <span>{item.corridas}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

UtrView.displayName = 'UtrView';

export default UtrView;
