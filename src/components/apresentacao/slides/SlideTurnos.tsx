import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { buildTimeTextStyle } from '../utils';

import { SubPracaModal } from './components/SubPracaModal';
import { SlideHeader } from './components/SlideHeader'; // Corrected import

interface TurnoResumo {
  aderencia: number;
  horasEntregues: string;
}

interface VariacaoResumo {
  label: string;
  valor: string;
  positivo: boolean;
}

interface TurnoComparativo {
  nome: string;
  horasPlanejadas: string; // Added to match new processor output
  semana1: TurnoResumo;
  semana2: TurnoResumo;
  variacoes: VariacaoResumo[];
}

interface SlideTurnosProps {
  isVisible: boolean;
  numeroSemana1: string;
  numeroSemana2: string;
  paginaAtual: number;
  totalPaginas: number;
  itens: TurnoComparativo[];
}

const buildCircleDasharray = (valor: number, radius: number) => {
  const clamped = Math.max(0, Math.min(100, valor));
  const circumference = 2 * Math.PI * radius;
  return `${(clamped / 100) * circumference} ${circumference}`;
};

// Variation badge component
const VariationBadge: React.FC<{ label: string; value: string; positive: boolean }> = ({ label, value, positive }) => (
  <div className={`flex-1 rounded-lg py-2 px-2 text-center ${positive ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
    <p className="text-[0.65rem] font-semibold text-slate-500 uppercase tracking-wide mb-1 leading-tight">{label}</p>
    <div className={`flex items-center justify-center gap-1 font-bold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
      {positive ? (
        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l-8 8h5v8h6v-8h5z" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 20l8-8h-5V4H9v8H4z" />
        </svg>
      )}
      <span className="text-base leading-none" style={buildTimeTextStyle(value, 1)}>{value}</span>
    </div>
  </div>
);

import { useAnimatedProgress } from '@/hooks/ui/useAnimatedProgress';

// Week circle with hours
const WeekCircle: React.FC<{
  semana: TurnoResumo;
  label: string;
  isSecond: boolean;
  size?: 'normal' | 'large';
  isActive?: boolean;
}> = ({ semana, label, isSecond, size = 'normal', isActive = true }) => {
  const circleSize = size === 'large' ? 'w-[120px] h-[120px]' : 'w-[100px] h-[100px]';
  const fontSize = size === 'large' ? 'text-xl' : 'text-base'; // Reduced from 2xl/lg

  // Animate adherence
  const animatedAderencia = useAnimatedProgress(semana.aderencia, 1000, 100, isActive);

  return (
    <div className="flex flex-col items-center gap-3">
      <span className={`text-sm font-bold px-5 py-1.5 rounded-full ${isSecond ? 'bg-blue-600 text-white' : 'bg-sky-50 text-sky-700 border border-sky-100'}`}>
        {label}
      </span>

      {/* Progress Circle */}
      <div className={`relative ${circleSize} animate-scale-in ${isActive ? 'animate-pulse-scale delay-500' : ''}`}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r="34" stroke="#e2e8f0" strokeWidth="7" fill="none" />
          <circle
            cx="50"
            cy="50"
            r="34"
            stroke={isSecond ? "#2563eb" : "#38bdf8"}
            strokeWidth="7"
            fill="none"
            strokeDasharray={buildCircleDasharray(animatedAderencia, 40)}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-0.5">
          <span className={`text-slate-900 font-black ${fontSize} leading-none tracking-tight`}>
            {semana.aderencia.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Hours */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-center min-w-[120px]">
        <span className="text-[0.6rem] font-semibold text-emerald-600 uppercase block">Entregue</span>
        <span className="font-bold text-emerald-700 block text-lg" style={buildTimeTextStyle(semana.horasEntregues, 1)}>
          {semana.horasEntregues}
        </span>
      </div>
    </div>
  );
};

const SlideTurnos: React.FC<SlideTurnosProps> = ({
  isVisible,
  numeroSemana1,
  numeroSemana2,
  paginaAtual,
  totalPaginas,
  itens,
}) => {
  const [selectedItem, setSelectedItem] = React.useState<TurnoComparativo | null>(null);

  return (
    <SlideWrapper isVisible={isVisible} style={{ padding: '32px 48px' }}>
      <SlideHeader
        title="TURNOS"
        subTitle={`Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`}
      />

      {totalPaginas > 1 && (
        <p className="text-center text-base font-medium text-slate-400 -mt-4 mb-6">
          Página {paginaAtual} de {totalPaginas}
        </p>
      )}

      <div className="grid grid-cols-2 gap-x-12 gap-y-8 flex-1 content-start mt-4">
        {itens.map((item, index) => (
          <div
            key={item.nome}
            onClick={() => setSelectedItem(item)}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6 hover:shadow-lg hover:scale-[1.01] transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-center">
              <h3 className="text-xl font-black text-slate-700 uppercase tracking-wider bg-slate-50 px-6 py-2 rounded-lg border border-slate-100">
                {item.nome}
              </h3>
            </div>

            <div className="flex justify-center items-center gap-12">
              <WeekCircle
                semana={item.semana1}
                label={`SEM ${numeroSemana1}`}
                isSecond={false}
                isActive={isVisible}
              />
              <WeekCircle
                semana={item.semana2}
                label={`SEM ${numeroSemana2}`}
                isSecond={true}
                isActive={isVisible}
              />
            </div>

            <div className="flex gap-3 mt-auto bg-slate-50 p-3 rounded-xl border border-slate-100">
              {item.variacoes.map((variacao) => (
                <VariationBadge
                  key={variacao.label}
                  label={variacao.label}
                  value={variacao.valor}
                  positive={variacao.positivo}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <SubPracaModal
          selectedItem={selectedItem as any}
          numeroSemana1={numeroSemana1}
          numeroSemana2={numeroSemana2}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </SlideWrapper>
  );
};

export default SlideTurnos;
