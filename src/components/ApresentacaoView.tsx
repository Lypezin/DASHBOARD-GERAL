import React, { useRef } from 'react';
import { DashboardResumoData } from '@/types';
import { formatarHorasParaHMS } from '@/utils/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ApresentacaoViewProps {
  dadosComparacao: DashboardResumoData[];
  semanasSelecionadas: string[];
  pracaSelecionada: string | null;
  onClose: () => void;
}

function ApresentacaoView({ dadosComparacao, semanasSelecionadas, pracaSelecionada, onClose }: ApresentacaoViewProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Extrair dados das duas semanas
  const semana1 = dadosComparacao[0];
  const semana2 = dadosComparacao[1];
  
  // Extrair números das semanas
  const numeroSemana1 = semanasSelecionadas[0]?.split('-W')[1] || '35';
  const numeroSemana2 = semanasSelecionadas[1]?.split('-W')[1] || '36';

  // Calcular diferenças
  const calcularDiferenca = (valor1: number, valor2: number) => {
    return valor2 - valor1;
  };

  const formatarDiferenca = (diferenca: number, isTime: boolean = false) => {
    const sinal = diferenca >= 0 ? '+' : '';
    if (isTime) {
      const horas = Math.abs(diferenca);
      const horasFormatadas = formatarHorasParaHMS(horas.toString());
      return `${sinal}${diferenca >= 0 ? '' : '-'}${horasFormatadas}`;
    }
    return `${sinal}${diferenca}`;
  };

  // Dados de aderência geral
  const aderencia1 = semana1?.semanal?.[0]?.aderencia_percentual || 0;
  const aderencia2 = semana2?.semanal?.[0]?.aderencia_percentual || 0;
  const horasEntregues1 = parseFloat(semana1?.semanal?.[0]?.horas_entregues || '0');
  const horasEntregues2 = parseFloat(semana2?.semanal?.[0]?.horas_entregues || '0');
  const horasAEntregar = parseFloat(semana1?.semanal?.[0]?.horas_a_entregar || '0');

  // Função para gerar PDF
  const gerarPDF = async () => {
    if (!contentRef.current) return;

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Relatorio_Semanas_${numeroSemana1}_${numeroSemana2}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header com botões */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Apresentação - Relatório de Resultados</h2>
          <div className="flex gap-2">
            <button
              onClick={gerarPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📄 Gerar PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              ✕ Fechar
            </button>
          </div>
        </div>

        {/* Conteúdo da apresentação */}
        <div ref={contentRef} className="p-8 bg-gradient-to-br from-blue-600 to-blue-800 text-white min-h-[800px]">
          {/* Slide 1 - Capa */}
          <div className="mb-12">
            <div className="text-center">
              <h1 className="text-6xl font-bold mb-4">RELATÓRIO DE</h1>
              <h1 className="text-6xl font-bold mb-8">RESULTADOS</h1>
              <h2 className="text-3xl font-semibold mb-4">{pracaSelecionada?.toUpperCase() || 'TODAS AS PRAÇAS'}</h2>
              <h3 className="text-2xl mb-4">SEMANA {numeroSemana1} & {numeroSemana2}</h3>
              <p className="text-xl">
                {/* Calcular datas aproximadas baseadas nas semanas */}
                {new Date(2024, 0, 1 + (parseInt(numeroSemana1) - 1) * 7).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {new Date(2024, 0, 7 + (parseInt(numeroSemana1) - 1) * 7).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} & {new Date(2024, 0, 1 + (parseInt(numeroSemana2) - 1) * 7).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {new Date(2024, 0, 7 + (parseInt(numeroSemana2) - 1) * 7).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Slide 2 - Aderência Geral */}
          <div className="mb-12 page-break">
            <h2 className="text-5xl font-bold mb-8 text-center">ADERÊNCIA</h2>
            <h3 className="text-3xl font-light mb-12 text-center text-blue-200">SEMANA {numeroSemana1} & {numeroSemana2}</h3>
            
            <div className="flex justify-center items-center gap-16">
              {/* Semana 1 */}
              <div className="text-center">
                <div className="text-2xl mb-4">{formatarHorasParaHMS(horasAEntregar.toString())}</div>
                <div className="relative w-48 h-48 mb-6">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#1e40af"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(aderencia1 / 100) * 251.2} 251.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold">{aderencia1.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="text-2xl font-bold">SEMANA {numeroSemana1}</div>
                <div className="text-xl">{formatarHorasParaHMS(horasEntregues1.toString())}</div>
              </div>

              {/* Semana 2 */}
              <div className="text-center">
                <div className="text-2xl mb-4">{formatarHorasParaHMS(horasAEntregar.toString())}</div>
                <div className="relative w-48 h-48 mb-6">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#1e40af"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(aderencia2 / 100) * 251.2} 251.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold">{aderencia2.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="text-2xl font-bold">SEMANA {numeroSemana2}</div>
                <div className="text-xl">{formatarHorasParaHMS(horasEntregues2.toString())}</div>
                <div className="text-lg text-red-300 mt-2">
                  {formatarDiferenca(calcularDiferenca(horasEntregues1, horasEntregues2), true)}
                </div>
              </div>
            </div>
          </div>

          {/* Slide 3 - Sub-Praças */}
          <div className="mb-12 page-break">
            <h2 className="text-5xl font-bold mb-8 text-center">SUB-PRAÇAS</h2>
            <h3 className="text-3xl font-light mb-12 text-center text-blue-200">SEMANA {numeroSemana1} & {numeroSemana2}</h3>
            
            <div className="grid grid-cols-2 gap-8">
              {semana1?.sub_praca?.slice(0, 4).map((subPraca: any, index: number) => {
                const subPraca2 = semana2?.sub_praca?.find((sp: any) => sp.sub_praca === subPraca.sub_praca);
                const aderencia1 = subPraca.aderencia_percentual || 0;
                const aderencia2 = subPraca2?.aderencia_percentual || 0;
                const horas1 = parseFloat(subPraca.horas_entregues || '0');
                const horas2 = parseFloat(subPraca2?.horas_entregues || '0');
                
                return (
                  <div key={index} className="text-center">
                    <h4 className="text-xl font-bold mb-4">{subPraca.sub_praca?.toUpperCase()}</h4>
                    <div className="text-lg mb-2">{parseFloat(subPraca.horas_a_entregar || '0').toFixed(2)}</div>
                    
                    <div className="flex justify-center gap-8">
                      {/* Semana 1 */}
                      <div>
                        <div className="relative w-24 h-24 mb-2">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="35" stroke="rgba(255,255,255,0.3)" strokeWidth="6" fill="none" />
                            <circle
                              cx="50" cy="50" r="35"
                              stroke="#1e40af" strokeWidth="6" fill="none"
                              strokeDasharray={`${(aderencia1 / 100) * 219.8} 219.8`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold">{aderencia1.toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="text-sm">SEMANA {numeroSemana1}</div>
                        <div className="text-sm">{formatarHorasParaHMS(horas1.toString())}</div>
                      </div>

                      {/* Semana 2 */}
                      <div>
                        <div className="relative w-24 h-24 mb-2">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="35" stroke="rgba(255,255,255,0.3)" strokeWidth="6" fill="none" />
                            <circle
                              cx="50" cy="50" r="35"
                              stroke="#1e40af" strokeWidth="6" fill="none"
                              strokeDasharray={`${(aderencia2 / 100) * 219.8} 219.8`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold">{aderencia2.toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="text-sm">SEMANA {numeroSemana2}</div>
                        <div className="text-sm">{formatarHorasParaHMS(horas2.toString())}</div>
                        <div className="text-xs text-red-300 mt-1">
                          {formatarDiferenca(calcularDiferenca(horas1, horas2), true)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Slide 4 - Aderência Diária */}
          <div className="mb-12 page-break">
            <h2 className="text-5xl font-bold mb-8 text-center">ADERÊNCIA DIÁRIA</h2>
            <h3 className="text-3xl font-light mb-12 text-center text-blue-200">SEMANA {numeroSemana1} & {numeroSemana2}</h3>
            
            {/* Semana 1 */}
            <div className="mb-8">
              <h4 className="text-2xl font-bold mb-4 text-center">SEMANA {numeroSemana1}</h4>
              <div className="flex justify-center gap-4">
                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia, index) => {
                  const diaData = semana1?.dia?.find((d: any) => d.dia_da_semana === dia);
                  const aderencia = diaData?.aderencia_percentual || 0;
                  const horasEntregues = parseFloat(diaData?.horas_entregues || '0');
                  
                  return (
                    <div key={index} className="text-center">
                      <div className="text-lg mb-2">{parseFloat(diaData?.horas_a_entregar || '0').toFixed(2)}</div>
                      <div className="relative w-16 h-16 mb-2">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="30" stroke="rgba(255,255,255,0.3)" strokeWidth="4" fill="none" />
                          <circle
                            cx="50" cy="50" r="30"
                            stroke="#1e40af" strokeWidth="4" fill="none"
                            strokeDasharray={`${(aderencia / 100) * 188.4} 188.4`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold">{aderencia.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="text-xs font-bold">{dia.toUpperCase()}</div>
                      <div className="text-xs">{formatarHorasParaHMS(horasEntregues.toString())}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Semana 2 */}
            <div>
              <h4 className="text-2xl font-bold mb-4 text-center">SEMANA {numeroSemana2}</h4>
              <div className="flex justify-center gap-4">
                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia, index) => {
                  const diaData1 = semana1?.dia?.find((d: any) => d.dia_da_semana === dia);
                  const diaData2 = semana2?.dia?.find((d: any) => d.dia_da_semana === dia);
                  const aderencia = diaData2?.aderencia_percentual || 0;
                  const horasEntregues1 = parseFloat(diaData1?.horas_entregues || '0');
                  const horasEntregues2 = parseFloat(diaData2?.horas_entregues || '0');
                  
                  return (
                    <div key={index} className="text-center">
                      <div className="text-lg mb-2">{parseFloat(diaData2?.horas_a_entregar || '0').toFixed(2)}</div>
                      <div className="relative w-16 h-16 mb-2">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="30" stroke="rgba(255,255,255,0.3)" strokeWidth="4" fill="none" />
                          <circle
                            cx="50" cy="50" r="30"
                            stroke="#1e40af" strokeWidth="4" fill="none"
                            strokeDasharray={`${(aderencia / 100) * 188.4} 188.4`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold">{aderencia.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="text-xs font-bold">{dia.toUpperCase()}</div>
                      <div className="text-xs">{formatarHorasParaHMS(horasEntregues2.toString())}</div>
                      <div className="text-xs text-red-300 mt-1">
                        {formatarDiferenca(calcularDiferenca(horasEntregues1, horasEntregues2), true)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Slide 5 - Turnos */}
          <div className="mb-12 page-break">
            <h2 className="text-5xl font-bold mb-8 text-center">TURNOS</h2>
            <h3 className="text-3xl font-light mb-12 text-center text-blue-200">SEMANA {numeroSemana1} & {numeroSemana2}</h3>
            
            <div className="space-y-6">
              {semana1?.turno?.map((turno: any, index: number) => {
                const turno2 = semana2?.turno?.find((t: any) => t.periodo === turno.periodo);
                const aderencia1 = turno.aderencia_percentual || 0;
                const aderencia2 = turno2?.aderencia_percentual || 0;
                const horas1 = parseFloat(turno.horas_entregues || '0');
                const horas2 = parseFloat(turno2?.horas_entregues || '0');
                const diferenca = calcularDiferenca(horas1, horas2);
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    {/* Semana 1 */}
                    <div className="flex items-center gap-4">
                      <div className="text-xl font-bold w-24">{turno.periodo?.toUpperCase()}</div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-6 bg-blue-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-800 rounded-full"
                            style={{ width: `${aderencia1}%` }}
                          ></div>
                        </div>
                        <span className="text-lg font-bold w-16">{aderencia1.toFixed(1)}%</span>
                        <span className="text-sm w-20">{formatarHorasParaHMS(horas1.toString())}</span>
                      </div>
                      <div className="text-sm">{parseFloat(turno.horas_a_entregar || '0').toFixed(2)}</div>
                    </div>

                    {/* Semana 2 */}
                    <div className="flex items-center gap-4">
                      <div className="text-xl font-bold w-24">{turno.periodo?.toUpperCase()}</div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-6 bg-blue-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-800 rounded-full"
                            style={{ width: `${aderencia2}%` }}
                          ></div>
                        </div>
                        <span className="text-lg font-bold w-16">{aderencia2.toFixed(1)}%</span>
                        <span className="text-sm w-20">{formatarHorasParaHMS(horas2.toString())}</span>
                        <span className={`text-sm w-24 ${diferenca >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                          {formatarDiferenca(diferenca, true)}
                        </span>
                      </div>
                      <div className="text-sm">{parseFloat(turno2?.horas_a_entregar || '0').toFixed(2)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Slide 6 - Demanda e Rejeites */}
          <div className="page-break">
            <h2 className="text-5xl font-bold mb-8 text-center">DEMANDA E REJEITES</h2>
            <h3 className="text-3xl font-light mb-12 text-center text-blue-200">SEMANA {numeroSemana1} & {numeroSemana2}</h3>
            
            <div className="flex justify-center gap-16">
              {/* Semana 1 */}
              <div className="text-center">
                <h4 className="text-3xl font-bold mb-8">SEMANA {numeroSemana1}</h4>
                <div className="space-y-4 text-left">
                  <div className="text-2xl">
                    <span className="font-bold">OFERTADAS - </span>
                    {semana1?.totais?.corridas_ofertadas || 0}
                  </div>
                  <div className="text-2xl">
                    <span className="font-bold">COMPLETADAS - </span>
                    {semana1?.totais?.corridas_completadas || 0}
                  </div>
                  <div className="text-2xl">
                    <span className="font-bold">REJEITADAS - </span>
                    {semana1?.totais?.corridas_rejeitadas || 0}
                  </div>
                </div>
                
                <div className="mt-8">
                  <div className="w-48 h-12 bg-blue-200 rounded-full overflow-hidden mx-auto">
                    <div 
                      className="h-full bg-blue-800 rounded-full flex items-center justify-center"
                      style={{ 
                        width: `${((semana1?.totais?.corridas_rejeitadas || 0) / (semana1?.totais?.corridas_ofertadas || 1)) * 100}%` 
                      }}
                    >
                      <span className="text-white font-bold text-xl">
                        {(((semana1?.totais?.corridas_rejeitadas || 0) / (semana1?.totais?.corridas_ofertadas || 1)) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-xl font-bold mt-2">REJEITES</div>
                </div>
              </div>

              {/* Semana 2 */}
              <div className="text-center">
                <h4 className="text-3xl font-bold mb-8">SEMANA {numeroSemana2}</h4>
                <div className="space-y-4 text-left">
                  <div className="text-2xl">
                    <span className="font-bold">OFERTADAS - </span>
                    {semana2?.totais?.corridas_ofertadas || 0}
                    <span className="text-green-300 ml-4">
                      {formatarDiferenca(calcularDiferenca(semana1?.totais?.corridas_ofertadas || 0, semana2?.totais?.corridas_ofertadas || 0))}
                    </span>
                  </div>
                  <div className="text-2xl">
                    <span className="font-bold">COMPLETADAS - </span>
                    {semana2?.totais?.corridas_completadas || 0}
                    <span className="text-green-300 ml-4">
                      {formatarDiferenca(calcularDiferenca(semana1?.totais?.corridas_completadas || 0, semana2?.totais?.corridas_completadas || 0))}
                    </span>
                  </div>
                  <div className="text-2xl">
                    <span className="font-bold">REJEITADAS - </span>
                    {semana2?.totais?.corridas_rejeitadas || 0}
                    <span className="text-red-300 ml-4">
                      {formatarDiferenca(calcularDiferenca(semana1?.totais?.corridas_rejeitadas || 0, semana2?.totais?.corridas_rejeitadas || 0))}
                    </span>
                  </div>
                </div>
                
                <div className="mt-8">
                  <div className="w-48 h-12 bg-blue-200 rounded-full overflow-hidden mx-auto">
                    <div 
                      className="h-full bg-blue-800 rounded-full flex items-center justify-center"
                      style={{ 
                        width: `${((semana2?.totais?.corridas_rejeitadas || 0) / (semana2?.totais?.corridas_ofertadas || 1)) * 100}%` 
                      }}
                    >
                      <span className="text-white font-bold text-xl">
                        {(((semana2?.totais?.corridas_rejeitadas || 0) / (semana2?.totais?.corridas_ofertadas || 1)) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-xl font-bold mt-2">REJEITES</div>
                  <div className="text-lg text-green-300 mt-2">
                    {formatarDiferenca(
                      calcularDiferenca(
                        ((semana1?.totais?.corridas_rejeitadas || 0) / (semana1?.totais?.corridas_ofertadas || 1)) * 100,
                        ((semana2?.totais?.corridas_rejeitadas || 0) / (semana2?.totais?.corridas_ofertadas || 1)) * 100
                      )
                    )}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApresentacaoView;
