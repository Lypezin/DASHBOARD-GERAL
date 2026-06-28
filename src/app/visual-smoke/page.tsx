'use client';

import React, { useMemo, useState } from 'react';
import { ApresentacaoPreview } from '@/components/apresentacao/ApresentacaoPreview';
import { PresentationEditorProvider } from '@/components/apresentacao/context/PresentationEditorContext';
import SlideSubPracas from '@/components/apresentacao/slides/SlideSubPracas';
import SlideOrigem from '@/components/apresentacao/slides/SlideOrigem';
import SlideTurnos from '@/components/apresentacao/slides/SlideTurnos';

const itemBase = {
  horasPlanejadas: '32993:56:60',
  semana1: { aderencia: 20.62, horasPlanejadas: '32993:56:60', horasEntregues: '6803:39:49' },
  semana2: { aderencia: 18.27, horasPlanejadas: '32926:13:60', horasEntregues: '6015:34:50' },
  variacoes: [
    { label: 'Horas', valor: '-788:04:59', positivo: false },
    { label: '% Horas', valor: '-11,6%', positivo: false },
    { label: '% Aderência', valor: '-2,4%', positivo: false },
  ],
};

export default function VisualSmokePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = useMemo(() => [
    {
      key: 'sub-pracas',
      render: (visible: boolean) => (
        <SlideSubPracas
          isVisible={visible}
          numeroSemana1="5"
          numeroSemana2="7"
          paginaAtual={1}
          totalPaginas={8}
          itens={[
            { ...itemBase, nome: 'Centro Expandido Norte' },
            { ...itemBase, nome: 'Leste Operacional' },
            { ...itemBase, nome: 'Zona Sul Premium' },
            { ...itemBase, nome: 'Região Oeste' },
          ]}
        />
      ),
    },
    {
      key: 'origens',
      render: (visible: boolean) => (
        <SlideOrigem
          isVisible={visible}
          numeroSemana1="5"
          numeroSemana2="7"
          paginaAtual={2}
          totalPaginas={8}
          itens={[
            { ...itemBase, nome: 'IFOOD' },
            { ...itemBase, nome: 'RETIRADA LOJA' },
            { ...itemBase, nome: 'APP PROPRIO' },
          ]}
        />
      ),
    },
    {
      key: 'turnos',
      render: (visible: boolean) => (
        <SlideTurnos
          isVisible={visible}
          numeroSemana1="5"
          numeroSemana2="7"
          paginaAtual={1}
          totalPaginas={8}
          itens={[
            { ...itemBase, nome: 'ALMOÇO' },
            { ...itemBase, nome: 'ALMOÇO 11H30-15H29' },
          ]}
        />
      ),
    },
  ], []);

  return (
    <PresentationEditorProvider initialOrder={slides.map((slide) => slide.key)}>
      <main className="min-h-screen bg-slate-950 p-4">
        <ApresentacaoPreview
          slides={slides}
          currentSlide={currentSlide}
          onSlideChange={setCurrentSlide}
          onNext={() => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))}
          onPrev={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
          onClose={() => undefined}
          numeroSemana1="5"
          numeroSemana2="7"
          visibleSections={{}}
          onToggleSection={() => undefined}
          onStartPresentation={() => undefined}
        />
      </main>
    </PresentationEditorProvider>
  );
}
