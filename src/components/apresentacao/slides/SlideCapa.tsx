'use client';

import React from 'react';
import SlideWrapper from '../SlideWrapper';

interface SlideCapaProps {
  isVisible: boolean;
  pracaSelecionada: string | null;
  numeroSemana1: string;
  numeroSemana2: string;
  periodoSemana1: string;
  periodoSemana2: string;
}

const SlideCapa: React.FC<SlideCapaProps> = ({
  isVisible,
  pracaSelecionada,
  numeroSemana1,
  numeroSemana2,
  periodoSemana1,
  periodoSemana2,
}) => (
  <SlideWrapper
    isVisible={isVisible}
    className="bg-background text-foreground"
    style={{ padding: '52px 64px', overflow: 'hidden', background: 'hsl(var(--background))' }}
  >
    <header className="absolute inset-x-16 top-12 flex items-center justify-center gap-5 text-primary">
      <span className="h-px flex-1 bg-border" />
      <div className="text-center">
        <p className="font-serif text-3xl font-semibold tracking-tight">GO Itaim</p>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.35em] text-muted-foreground">Folhas de operação</p>
      </div>
      <span className="h-px flex-1 bg-border" />
    </header>

    <main className="flex h-full w-full flex-col items-center justify-center px-8 pt-12 text-center">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Comparativo semanal</p>
      <h1 className="mb-8 text-7xl font-semibold leading-[0.95] tracking-tight text-primary">
        Comparativo<br />Semanal
      </h1>

      {pracaSelecionada ? (
        <div className="mb-8 border-y border-border px-12 py-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">Praça de operação</p>
          <p className="mt-1 font-serif text-4xl text-foreground">{pracaSelecionada}</p>
        </div>
      ) : null}

      <div className="grid w-full max-w-4xl grid-cols-[1fr_auto_1fr] items-center gap-4">
        <WeekCard number={numeroSemana1} period={periodoSemana1} />
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border font-serif text-sm italic text-muted-foreground">vs.</span>
        <WeekCard number={numeroSemana2} period={periodoSemana2} recent />
      </div>
    </main>

    <footer className="absolute inset-x-16 bottom-10 flex items-center justify-between border-t border-border pt-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
      <span>GO Itaim · Operações</span>
      <span>Relatório comparativo</span>
    </footer>
  </SlideWrapper>
);

function WeekCard({ number, period, recent = false }: { number: string; period: string; recent?: boolean }) {
  return (
    <section className={`relative rounded-lg border border-border px-6 py-6 ${recent ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'}`}>
      {recent ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-sm bg-amber-400 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-950">
          Semana mais recente
        </span>
      ) : null}
      <p className="font-serif text-3xl">Semana {number}</p>
      <p className={`mt-3 border-t pt-3 text-sm ${recent ? 'border-primary-foreground/25 text-primary-foreground/80' : 'border-border text-muted-foreground'}`}>
        {period}
      </p>
    </section>
  );
}

export default SlideCapa;
