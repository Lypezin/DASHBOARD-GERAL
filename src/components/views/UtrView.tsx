import React from 'react';
import { UtrData } from '@/types';

function UtrView({
  utrData,
  loading,
}: {
  utrData: UtrData | null;
  loading: boolean;
}) {
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

  // Usar os nomes corretos que vêm do backend (com fallback para compatibilidade)
  const porPraca = utrData.praca || utrData.por_praca || [];
  const porSubPraca = utrData.sub_praca || utrData.por_sub_praca || [];
  const porOrigem = utrData.origem || utrData.por_origem || [];
  const porTurno = utrData.turno || utrData.por_turno || [];

  return (
    <div className="space-y-6">
      {/* UTR Geral */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-600 p-6 shadow-lg dark:border-blue-900">
        <h2 className="mb-4 text-sm font-semibold text-blue-100">📏 UTR Geral</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-blue-100">Tempo Total (horas)</p>
            <p className="text-3xl font-bold text-white">{utrData.geral.tempo_horas.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-blue-100">Corridas Completadas</p>
            <p className="text-3xl font-bold text-white">{utrData.geral.corridas.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-blue-100">UTR (Corridas/Hora)</p>
            <p className="text-3xl font-bold text-white">{utrData.geral.utr.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* UTR por Praça */}
      {porPraca && porPraca.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <span className="text-xl">🏢</span>
            UTR por Praça
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {porPraca.map((item) => (
              <div key={item.praca} className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <p className="mb-2 text-sm font-bold text-slate-900 dark:text-white">{item.praca}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Tempo:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.tempo_horas.toFixed(2)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Corridas:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.corridas}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-emerald-200 pt-2 dark:border-emerald-800">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">UTR:</span>
                    <span className="text-lg font-bold text-emerald-900 dark:text-emerald-100">{item.utr.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UTR por Sub-Praça */}
      {porSubPraca && porSubPraca.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <span className="text-xl">📍</span>
            UTR por Sub-Praça
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {porSubPraca.map((item) => (
              <div key={item.sub_praca} className="rounded-lg border border-violet-100 bg-violet-50/50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
                <p className="mb-2 text-sm font-bold text-slate-900 dark:text-white">{item.sub_praca}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Tempo:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.tempo_horas.toFixed(2)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Corridas:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.corridas}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-violet-200 pt-2 dark:border-violet-800">
                    <span className="font-bold text-violet-700 dark:text-violet-300">UTR:</span>
                    <span className="text-lg font-bold text-violet-900 dark:text-violet-100">{item.utr.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UTR por Origem */}
      {porOrigem && porOrigem.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <span className="text-xl">🎯</span>
            UTR por Origem
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {porOrigem.map((item) => (
              <div key={item.origem} className="rounded-lg border border-orange-100 bg-orange-50/50 p-4 dark:border-orange-900 dark:bg-orange-950/30">
                <p className="mb-2 text-sm font-bold text-slate-900 dark:text-white">{item.origem}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Tempo:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.tempo_horas.toFixed(2)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Corridas:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.corridas}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-orange-200 pt-2 dark:border-orange-800">
                    <span className="font-bold text-orange-700 dark:text-orange-300">UTR:</span>
                    <span className="text-lg font-bold text-orange-900 dark:text-orange-100">{item.utr.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UTR por Turno */}
      {porTurno && porTurno.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <span className="text-xl">⏰</span>
            UTR por Turno
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {porTurno.map((item) => (
              <div key={item.turno || item.periodo} className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                <p className="mb-2 text-sm font-bold text-slate-900 dark:text-white">{item.turno || item.periodo || 'N/D'}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Tempo:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.tempo_horas.toFixed(2)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Corridas:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.corridas}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-blue-200 pt-2 dark:border-blue-800">
                    <span className="font-bold text-blue-700 dark:text-blue-300">UTR:</span>
                    <span className="text-lg font-bold text-blue-900 dark:text-blue-100">{item.utr.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default UtrView;
