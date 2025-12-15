import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { SlideHeader } from './components/SlideHeader';
import { DayCard, DiaSemanaResumo } from './components/DayCard';

interface DiaSemanaComparado extends DiaSemanaResumo {
  diferencaHoras: string;
  diferencaHorasPositiva: boolean;
  diferencaPercentualHoras: string;
  diferencaPercentualHorasPositiva: boolean;
  diferencaAderencia: string;
  diferencaAderenciaPositiva: boolean;
}

interface SlideAderenciaDiariaProps {
  isVisible: boolean;
  numeroSemana1: string;
  numeroSemana2: string;
  semana1Dias: DiaSemanaResumo[];
  semana2Dias: DiaSemanaComparado[];
}

const SlideAderenciaDiaria: React.FC<SlideAderenciaDiariaProps> = ({
  isVisible,
  numeroSemana1,
  numeroSemana2,
  semana1Dias,
  semana2Dias,
}) => {
  return (
    <SlideWrapper isVisible={isVisible} style={{ padding: '8px 16px' }}>
      <SlideHeader
        title="ADERÊNCIA DIÁRIA"
        subTitle={`Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`}
      />

      {/* Content */}
      <section className="flex-1 flex flex-col gap-2">
        {/* Week 1 Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-sky-300" />
            <h3 className="text-sm font-bold text-sky-700 px-4 py-1 bg-sky-50 rounded-full border border-sky-200">
              SEMANA {numeroSemana1}
            </h3>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-sky-300" />
          </div>
          <div className="grid grid-cols-7 gap-2">
            {semana1Dias.map((dia) => (
              <DayCard
                key={`sem1-${dia.sigla}`}
                dia={dia}
                isSecondWeek={false}
                isActive={isVisible}
              />
            ))}
          </div>
        </div>

        {/* Week 2 Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-blue-300" />
            <h3 className="text-sm font-bold text-white px-4 py-1 bg-blue-600 rounded-full shadow">
              SEMANA {numeroSemana2}
            </h3>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-blue-300" />
          </div>
          <div className="grid grid-cols-7 gap-2">
            {semana2Dias.map((dia) => (
              <DayCard
                key={`sem2-${dia.sigla}`}
                dia={dia}
                isSecondWeek={true}
                isActive={isVisible}
                variacao={{
                  horas: dia.diferencaHoras,
                  horasPositiva: dia.diferencaHorasPositiva,
                  percentual: dia.diferencaPercentualHoras,
                  percentualPositiva: dia.diferencaPercentualHorasPositiva,
                }}
              />
            ))}
          </div>
        </div>

        {/* Summary Bar */}
        <div className="bg-gradient-to-r from-slate-100 via-white to-slate-100 rounded-lg border border-slate-200 px-3 py-2">
          <div className="grid grid-cols-7 gap-2">
            {semana2Dias.map((dia) => (
              <div key={`summary-${dia.sigla}`} className="text-center">
                <span className="text-[0.65rem] font-medium text-slate-500 block">{dia.sigla}</span>
                <div className={`inline-flex items-center justify-center gap-0.5 px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${dia.diferencaPercentualHorasPositiva
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}>
                  {dia.diferencaPercentualHorasPositiva ? (
                    <svg className="w-2 h-2 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4l-8 8h5v8h6v-8h5z" />
                    </svg>
                  ) : (
                    <svg className="w-2 h-2 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 20l8-8h-5V4H9v8H4z" />
                    </svg>
                  )}
                  <span>{dia.diferencaPercentualHoras}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SlideWrapper>
  );
};

export default SlideAderenciaDiaria;
