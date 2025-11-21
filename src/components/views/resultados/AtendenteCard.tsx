'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Send, CheckCircle2 } from 'lucide-react';
import { AtendenteCidadeData } from '@/types';

export interface AtendenteData {
  nome: string;
  enviado: number;
  liberado: number;
  custoPorLiberado?: number;
  quantidadeLiberados?: number;
  valorTotal?: number;
  fotoUrl?: string | null;
  cidades?: AtendenteCidadeData[];
}

const META_CUSTO = 50;

interface AtendenteCardProps {
  atendenteData: AtendenteData;
}

export const AtendenteCard = React.memo(function AtendenteCard({ 
  atendenteData 
}: AtendenteCardProps) {
  const [imageError, setImageError] = useState(false);
  const iniciais = atendenteData.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const calcularMetaInfo = (custoPorLiberado?: number, quantidadeLiberados?: number, valorTotal?: number) => {
    if (!custoPorLiberado || custoPorLiberado <= 0) return null;
    
    let faltamLiberados = 0;
    let jaAtingiuMeta = false;

    if (custoPorLiberado > META_CUSTO && quantidadeLiberados && quantidadeLiberados > 0) {
      faltamLiberados = Math.ceil((valorTotal! - META_CUSTO * quantidadeLiberados) / META_CUSTO);
      if (faltamLiberados < 0) {
        faltamLiberados = 0;
      }
    } else if (custoPorLiberado <= META_CUSTO && custoPorLiberado > 0) {
      jaAtingiuMeta = true;
    }

    return { faltamLiberados, jaAtingiuMeta };
  };

  const metaInfoAtendente = calcularMetaInfo(
    atendenteData.custoPorLiberado,
    atendenteData.quantidadeLiberados,
    atendenteData.valorTotal
  );

  return (
    <Card 
      className="group border-slate-200/50 bg-white/90 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 dark:border-slate-700/50 dark:bg-slate-800/90 flex flex-col h-full"
    >
      <div className="p-4 space-y-4 flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Card do Atendente - Compacto */}
        <div className="space-y-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            {atendenteData.fotoUrl && !imageError ? (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-purple-200 dark:ring-purple-800">
                <Image
                  src={atendenteData.fotoUrl}
                  alt={atendenteData.nome}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                  unoptimized
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm ring-2 ring-purple-200 dark:ring-purple-800">
                {iniciais}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate" title={atendenteData.nome}>
                {atendenteData.nome}
              </h3>
            </div>
          </div>
          
          {/* Métricas do Atendente */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-emerald-50/80 p-2.5 dark:bg-emerald-950/30">
              <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 mb-1">Enviado</p>
              <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100 font-mono">{atendenteData.enviado.toLocaleString('pt-BR')}</p>
            </div>
            <div className="rounded-lg bg-blue-50/80 p-2.5 dark:bg-blue-950/30">
              <p className="text-[10px] font-medium text-blue-700 dark:text-blue-300 mb-1">Liberado</p>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100 font-mono">{atendenteData.liberado.toLocaleString('pt-BR')}</p>
            </div>
          </div>

          {/* Custo por Liberado do Atendente */}
          {atendenteData.custoPorLiberado !== undefined && atendenteData.custoPorLiberado > 0 ? (
            <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 space-y-2">
              <div className="rounded-lg bg-purple-50/80 p-2.5 dark:bg-purple-950/30">
                <p className="text-[10px] font-medium text-purple-700 dark:text-purple-300 mb-1">Custo por Liberado</p>
                <p className="text-lg font-bold text-purple-900 dark:text-purple-100 font-mono">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(atendenteData.custoPorLiberado)}
                </p>
              </div>
              {/* Informação de quantos liberados faltam para R$ 50 */}
              {metaInfoAtendente && (
                <div className={`rounded-lg p-2.5 ${
                  metaInfoAtendente.jaAtingiuMeta 
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30' 
                    : 'bg-orange-50/80 dark:bg-orange-950/30'
                }`}>
                  {metaInfoAtendente.jaAtingiuMeta ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">✅</span>
                      <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                        Meta atingida! Custo abaixo de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(META_CUSTO)}
                      </p>
                    </div>
                  ) : metaInfoAtendente.faltamLiberados > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🎯</span>
                      <p className="text-[10px] font-medium text-orange-700 dark:text-orange-300">
                        Faltam <span className="font-bold">{metaInfoAtendente.faltamLiberados}</span> liberado{metaInfoAtendente.faltamLiberados !== 1 ? 's' : ''} para chegar a {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(META_CUSTO)}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>
        
        {/* Métricas por Cidade - Integradas */}
        {atendenteData.cidades && atendenteData.cidades.filter(c => c.enviado > 0 || c.liberado > 0).length > 0 && (
          <div className="space-y-2 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
              <MapPin className="h-3.5 w-3.5 text-purple-500" />
              <h4 className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Por Cidade ({atendenteData.cidades.filter(c => c.enviado > 0 || c.liberado > 0).length})
              </h4>
            </div>
            <div className="space-y-1.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-transparent flex-1 min-h-0">
              {atendenteData.cidades
                .filter(c => c.enviado > 0 || c.liberado > 0)
                .map((cidadeData) => {
                  const metaInfoCidade = calcularMetaInfo(
                    cidadeData.custoPorLiberado,
                    cidadeData.quantidadeLiberados,
                    cidadeData.valorTotal
                  );

                  return (
                    <div
                      key={`${atendenteData.nome}-${cidadeData.cidade}`}
                      className="group/city rounded-lg border border-slate-200/50 bg-gradient-to-br from-slate-50 to-white p-2.5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-purple-300/50 dark:border-slate-700/50 dark:from-slate-800/50 dark:to-slate-900/50 dark:hover:border-purple-500/50"
                    >
                      <p className="text-[11px] font-semibold text-slate-900 dark:text-white mb-2 truncate" title={cidadeData.cidade}>
                        {cidadeData.cidade}
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge 
                            variant="secondary" 
                            className="bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800 px-2 py-0.5"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            <span className="text-[10px] font-medium">Enviado:</span>
                            <span className="text-[11px] font-bold font-mono ml-1">{cidadeData.enviado.toLocaleString('pt-BR')}</span>
                          </Badge>
                          <Badge 
                            variant="secondary" 
                            className="bg-blue-50/80 text-blue-900 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-100 border-blue-200 dark:border-blue-800 px-2 py-0.5"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            <span className="text-[10px] font-medium">Liberado:</span>
                            <span className="text-[11px] font-bold font-mono ml-1">{cidadeData.liberado.toLocaleString('pt-BR')}</span>
                          </Badge>
                        </div>
                        {cidadeData.custoPorLiberado !== undefined && cidadeData.custoPorLiberado > 0 && (
                          <div className="pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50 space-y-1.5">
                            <Badge 
                              variant="secondary" 
                              className="bg-purple-50/80 text-purple-900 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-100 border-purple-200 dark:border-purple-800 px-2 py-0.5 w-full justify-start"
                            >
                              <span className="text-[10px] font-medium">Custo por Liberado:</span>
                              <span className="text-[11px] font-bold font-mono ml-1">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(cidadeData.custoPorLiberado)}
                              </span>
                            </Badge>
                            {/* Informação de quantos liberados faltam para R$ 50 */}
                            {metaInfoCidade && (
                              <Badge 
                                variant="secondary" 
                                className={`px-2 py-0.5 w-full justify-start ${
                                  metaInfoCidade.jaAtingiuMeta
                                    ? 'bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-orange-50/80 text-orange-900 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-100 border-orange-200 dark:border-orange-800'
                                }`}
                              >
                                {metaInfoCidade.jaAtingiuMeta ? (
                                  <>
                                    <span className="text-[9px]">✅</span>
                                    <span className="text-[10px] font-medium ml-1">
                                      Meta atingida! Abaixo de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(META_CUSTO)}
                                    </span>
                                  </>
                                ) : metaInfoCidade.faltamLiberados > 0 ? (
                                  <>
                                    <span className="text-[9px]">🎯</span>
                                    <span className="text-[10px] font-medium ml-1">
                                      Faltam <span className="font-bold">{metaInfoCidade.faltamLiberados}</span> liberado{metaInfoCidade.faltamLiberados !== 1 ? 's' : ''} para chegar a {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(META_CUSTO)}
                                    </span>
                                  </>
                                ) : null}
                              </Badge>
                            )}
                            {cidadeData.quantidadeLiberados !== undefined && cidadeData.quantidadeLiberados > 0 && cidadeData.valorTotal !== undefined && cidadeData.valorTotal > 0 && (
                              <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">
                                {cidadeData.quantidadeLiberados} liberado{cidadeData.quantidadeLiberados !== 1 ? 's' : ''} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cidadeData.valorTotal)} total
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
});

AtendenteCard.displayName = 'AtendenteCard';

