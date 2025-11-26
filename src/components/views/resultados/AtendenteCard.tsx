'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col">
      <CardContent className="p-4 flex flex-col flex-1 min-h-0 overflow-hidden space-y-4">
        {/* Card do Atendente - Compacto */}
        <div className="space-y-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            {atendenteData.fotoUrl && !imageError ? (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700">
                <Image
                  src={atendenteData.fotoUrl}
                  alt={atendenteData.nome}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                  unoptimized
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm border border-slate-200 dark:border-slate-700">
                {iniciais}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={atendenteData.nome}>
                {atendenteData.nome}
              </h3>
            </div>
          </div>

          {/* Métricas do Atendente */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-2 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">Enviado</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">{atendenteData.enviado.toLocaleString('pt-BR')}</p>
            </div>
            <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-2 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">Liberado</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">{atendenteData.liberado.toLocaleString('pt-BR')}</p>
            </div>
          </div>

          {/* Custo por Liberado do Atendente */}
          {atendenteData.custoPorLiberado !== undefined && atendenteData.custoPorLiberado > 0 ? (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-2 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Custo por Liberado</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(atendenteData.custoPorLiberado)}
                </p>
              </div>
              {/* Informação de quantos liberados faltam para R$ 50 */}
              {metaInfoAtendente && (
                <div className={`rounded-md p-2 border ${metaInfoAtendente.jaAtingiuMeta
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'
                  : 'bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30'
                  }`}>
                  {metaInfoAtendente.jaAtingiuMeta ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                        Meta atingida! Abaixo de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(META_CUSTO)}
                      </p>
                    </div>
                  ) : metaInfoAtendente.faltamLiberados > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">🎯</span>
                      <p className="text-[10px] font-medium text-orange-700 dark:text-orange-300">
                        Faltam <span className="font-bold">{metaInfoAtendente.faltamLiberados}</span> para {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(META_CUSTO)}
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
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                Por Cidade ({atendenteData.cidades.filter(c => c.enviado > 0 || c.liberado > 0).length})
              </h4>
            </div>
            <div className="space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 flex-1 min-h-0">
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
                      className="rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2.5"
                    >
                      <p className="text-[11px] font-medium text-slate-900 dark:text-white mb-2 truncate" title={cidadeData.cidade}>
                        {cidadeData.cidade}
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge
                            variant="outline"
                            className="bg-background px-2 py-0.5 h-auto font-normal"
                          >
                            <Send className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">Enviado:</span>
                            <span className="text-[11px] font-medium font-mono ml-1">{cidadeData.enviado.toLocaleString('pt-BR')}</span>
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-background px-2 py-0.5 h-auto font-normal"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">Liberado:</span>
                            <span className="text-[11px] font-medium font-mono ml-1">{cidadeData.liberado.toLocaleString('pt-BR')}</span>
                          </Badge>
                        </div>
                        {cidadeData.custoPorLiberado !== undefined && cidadeData.custoPorLiberado > 0 && (
                          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                            <Badge
                              variant="outline"
                              className="bg-background px-2 py-0.5 w-full justify-start h-auto font-normal"
                            >
                              <span className="text-[10px] text-muted-foreground">Custo/Lib:</span>
                              <span className="text-[11px] font-medium font-mono ml-1">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(cidadeData.custoPorLiberado)}
                              </span>
                            </Badge>
                            {/* Informação de quantos liberados faltam para R$ 50 */}
                            {metaInfoCidade && (
                              <Badge
                                variant="outline"
                                className={`px-2 py-0.5 w-full justify-start h-auto font-normal ${metaInfoCidade.jaAtingiuMeta
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30 text-orange-700 dark:text-orange-300'
                                  }`}
                              >
                                {metaInfoCidade.jaAtingiuMeta ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    <span className="text-[10px]">
                                      Meta atingida!
                                    </span>
                                  </>
                                ) : metaInfoCidade.faltamLiberados > 0 ? (
                                  <>
                                    <span className="text-[10px] mr-1">🎯</span>
                                    <span className="text-[10px]">
                                      Faltam <span className="font-bold">{metaInfoCidade.faltamLiberados}</span> para meta
                                    </span>
                                  </>
                                ) : null}
                              </Badge>
                            )}
                            {cidadeData.quantidadeLiberados !== undefined && cidadeData.quantidadeLiberados > 0 && cidadeData.valorTotal !== undefined && cidadeData.valorTotal > 0 && (
                              <p className="text-[9px] text-muted-foreground mt-1 px-1">
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
      </CardContent>
    </Card>
  );
});

AtendenteCard.displayName = 'AtendenteCard';

