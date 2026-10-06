'use client';

import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { HealthBadge, HealthGrade } from '@/components/ui/HealthBadge';
import { UserRound } from 'lucide-react';

interface EntregadorProfileHeaderProps {
  nome: string;
  id: string;
  grade: HealthGrade;
  score: number;
}

export const EntregadorProfileHeader = React.memo(function EntregadorProfileHeader({
  nome,
  id,
  grade,
  score,
}: EntregadorProfileHeaderProps) {
  const initials = nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('pt-BR');

  return (
    <DialogHeader className="relative overflow-hidden bg-gradient-to-br from-[#123b5a] via-[#164d72] to-[#17648a] px-5 pb-6 pt-7 text-left text-white sm:px-7 sm:pb-7">
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full border-[28px] border-white/[0.045]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-24 h-48 w-48 rounded-full border-[24px] border-sky-300/[0.07]" />

      <div className="relative flex flex-col gap-5 pr-8 sm:flex-row sm:items-center sm:justify-between sm:pr-12">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-lg font-bold tracking-wide text-white shadow-inner shadow-white/5">
            {initials || <UserRound className="h-6 w-6" aria-hidden="true" />}
          </div>
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-100/75">Perfil do entregador</p>
            <DialogTitle className="truncate text-xl font-bold tracking-tight text-white sm:text-2xl">{nome}</DialogTitle>
            <p className="mt-1 truncate font-mono text-xs text-sky-100/75">ID {id}</p>
          </div>
        </div>

        <div className="flex w-fit items-center gap-3 rounded-xl border border-white/15 bg-slate-950/15 px-3.5 py-2.5 backdrop-blur-sm">
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sky-100/70">Score operacional</p>
            <p className="mt-0.5 text-lg font-bold leading-none tabular-nums text-white">{score}<span className="ml-1 text-xs font-medium text-sky-100/65">/ 100</span></p>
          </div>
          <HealthBadge grade={grade} score={score} size="md" />
        </div>
      </div>

      <DialogDescription className="sr-only">
        Perfil e indicadores operacionais consolidados do entregador selecionado.
      </DialogDescription>
    </DialogHeader>
  );
});
