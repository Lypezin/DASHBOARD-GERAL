'use client';

import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { HealthBadge, HealthGrade } from '@/components/ui/HealthBadge';

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
  return (
    <DialogHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
      <DialogTitle className="flex items-center gap-3">
        <HealthBadge grade={grade} score={score} size="md" />
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{nome}</p>
          <p className="truncate text-xs text-slate-500">{id}</p>
        </div>
      </DialogTitle>
      <DialogDescription className="sr-only">
        Dados operacionais consolidados do entregador selecionado.
      </DialogDescription>
    </DialogHeader>
  );
});
