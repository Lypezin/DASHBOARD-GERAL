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
  
  // Extrair números das semanas corretamente
  const extrairNumeroSemana = (semana: string) => {
    if (semana.includes('-W')) {
      return semana.split('-W')[1];
    }
    return semana;
  };
  
  const numeroSemana1 = extrairNumeroSemana(semanasSelecionadas[0] || '35');
  const numeroSemana2 = extrairNumeroSemana(semanasSelecionadas[1] || '36');

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

  // Função para gerar PDF otimizada com páginas separadas
  const gerarPDF = async () => {
    if (!contentRef.current) return;

    try {
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Buscar todos os slides
      const slides = contentRef.current.querySelectorAll('.slide');
      
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;
        
        // Capturar cada slide individualmente com configurações otimizadas
        const canvas = await html2canvas(slide, {
          scale: 1.2, // Reduzido para 1.2 para melhor performance
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#3b82f6', // Cor de fundo azul
          width: slide.offsetWidth,
          height: slide.offsetHeight,
          logging: false, // Desabilitar logs para performance
          imageTimeout: 0,
          removeContainer: true,
          foreignObjectRendering: false, // Melhor compatibilidade
          ignoreElements: (element) => {
            // Ignorar elementos que podem causar problemas
            return element.tagName === 'IFRAME' || element.tagName === 'OBJECT';
          }
        });

        // Converter para JPEG com qualidade otimizada (85% - boa qualidade, menor tamanho)
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        
        // Calcular dimensões mantendo proporção
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const scaledWidth = imgWidth * ratio;
        const scaledHeight = imgHeight * ratio;
        const imgX = (pdfWidth - scaledWidth) / 2;
        const imgY = (pdfHeight - scaledHeight) / 2;

        // Adicionar nova página se não for a primeira
        if (i > 0) {
          pdf.addPage();
        }

        // Adicionar imagem à página
        pdf.addImage(imgData, 'JPEG', imgX, imgY, scaledWidth, scaledHeight);
      }

      pdf.save(`Relatorio_Semanas_${numeroSemana1}_${numeroSemana2}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header com botões */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-slate-900">Apresentação - Relatório de Resultados</h2>
          <div className="flex gap-2">
            <button
              onClick={gerarPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              📄 Gerar PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold"
            >
              ✕ Fechar
            </button>
          </div>
        </div>

        {/* Conteúdo da apresentação */}
        <div ref={contentRef} className="bg-white">
          {/* Slide 1 - Capa */}
          <div className="slide bg-gradient-to-br from-blue-600 to-blue-800 text-white min-h-screen flex items-center justify-center p-16">
            <div className="text-center max-w-4xl mx-auto">
              <div className="mb-12">
                <h1 className="text-8xl font-black mb-8 leading-tight tracking-wide">RELATÓRIO DE</h1>
                <h1 className="text-8xl font-black mb-16 leading-tight tracking-wide">RESULTADOS</h1>
              </div>
              <div className="space-y-8">
                <h2 className="text-5xl font-bold tracking-wide">{pracaSelecionada?.toUpperCase() || 'TODAS AS PRAÇAS'}</h2>
                <h3 className="text-4xl font-semibold">SEMANA {numeroSemana1} & {numeroSemana2}</h3>
                <div className="text-2xl font-medium opacity-90">
                  {new Date(2024, 0, 1 + (parseInt(numeroSemana1) - 1) * 7).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {new Date(2024, 0, 7 + (parseInt(numeroSemana1) - 1) * 7).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} & {new Date(2024, 0, 1 + (parseInt(numeroSemana2) - 1) * 7).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {new Date(2024, 0, 7 + (parseInt(numeroSemana2) - 1) * 7).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </div>
              </div>
            </div>
          </div>

          {/* Slide 2 - Aderência Geral */}
          <div className="slide bg-gradient-to-br from-blue-600 to-blue-800 text-white min-h-screen flex items-center justify-center p-16">
            <div className="text-center max-w-7xl mx-auto">
              <div className="mb-16">
                <h2 className="text-7xl font-black mb-6">ADERÊNCIA GERAL</h2>
                <h3 className="text-4xl font-light opacity-80">SEMANA {numeroSemana1} & {numeroSemana2}</h3>
              </div>
              
              <div className="flex justify-center items-start gap-24">
                {/* Semana 1 */}
                <div className="text-center">
                  <div className="relative w-80 h-80 mb-8">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        stroke="#ffffff"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(aderencia1 / 100) * 282.7} 282.7`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-6xl font-black leading-none block">{aderencia1.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-4xl font-bold mb-6">SEMANA {numeroSemana1}</div>
                  <div className="bg-white bg-opacity-10 rounded-2xl p-6 space-y-4">
                    <div className="text-2xl">
                      <span className="opacity-80">Planejado:</span>
                      <div className="font-bold">{formatarHorasParaHMS(horasAEntregar.toString())}</div>
                    </div>
                    <div className="text-2xl">
                      <span className="opacity-80">Entregue:</span>
                      <div className="font-bold">{formatarHorasParaHMS(horasEntregues1.toString())}</div>
                    </div>
                    <div className="text-xl opacity-80">
                      <div>Corridas: {semana1?.totais?.corridas_completadas || 0}/{semana1?.totais?.corridas_ofertadas || 0}</div>
                      <div>Taxa Aceitação: {semana1?.totais?.corridas_ofertadas ? ((semana1.totais.corridas_aceitas / semana1.totais.corridas_ofertadas) * 100).toFixed(1) : 0}%</div>
                    </div>
                  </div>
                </div>

                {/* Semana 2 */}
                <div className="text-center">
                  <div className="relative w-80 h-80 mb-8">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        stroke="#ffffff"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(aderencia2 / 100) * 282.7} 282.7`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-6xl font-black leading-none block">{aderencia2.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-4xl font-bold mb-6">SEMANA {numeroSemana2}</div>
                  <div className="bg-white bg-opacity-10 rounded-2xl p-6 space-y-4">
                    <div className="text-2xl">
                      <span className="opacity-80">Planejado:</span>
                      <div className="font-bold">{formatarHorasParaHMS(horasAEntregar.toString())}</div>
                    </div>
                    <div className="text-2xl">
                      <span className="opacity-80">Entregue:</span>
                      <div className="font-bold">{formatarHorasParaHMS(horasEntregues2.toString())}</div>
                      <div className={`text-lg font-bold mt-2 ${calcularDiferenca(horasEntregues1, horasEntregues2) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {formatarDiferenca(calcularDiferenca(horasEntregues1, horasEntregues2), true)}
                      </div>
                    </div>
                    <div className="text-xl opacity-80">
                      <div>Corridas: {semana2?.totais?.corridas_completadas || 0}/{semana2?.totais?.corridas_ofertadas || 0}
                        <span className={`ml-2 font-bold ${calcularDiferenca(semana1?.totais?.corridas_completadas || 0, semana2?.totais?.corridas_completadas || 0) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                          ({formatarDiferenca(calcularDiferenca(semana1?.totais?.corridas_completadas || 0, semana2?.totais?.corridas_completadas || 0))})
                        </span>
                      </div>
                      <div>Taxa Aceitação: {semana2?.totais?.corridas_ofertadas ? ((semana2.totais.corridas_aceitas / semana2.totais.corridas_ofertadas) * 100).toFixed(1) : 0}%
                        <span className={`ml-2 font-bold ${
                          calcularDiferenca(
                            semana1?.totais?.corridas_ofertadas ? ((semana1.totais.corridas_aceitas / semana1.totais.corridas_ofertadas) * 100) : 0,
                            semana2?.totais?.corridas_ofertadas ? ((semana2.totais.corridas_aceitas / semana2.totais.corridas_ofertadas) * 100) : 0
                          ) >= 0 ? 'text-green-300' : 'text-red-300'
                        }`}>
                          ({(() => {
                            const diff = calcularDiferenca(
                              semana1?.totais?.corridas_ofertadas ? ((semana1.totais.corridas_aceitas / semana1.totais.corridas_ofertadas) * 100) : 0,
                              semana2?.totais?.corridas_ofertadas ? ((semana2.totais.corridas_aceitas / semana2.totais.corridas_ofertadas) * 100) : 0
                            );
                            const sinal = diff >= 0 ? '+' : '';
                            return `${sinal}${diff.toFixed(1)}%`;
                          })()})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slide 3 - Sub-Praças */}
          <div className="slide bg-gradient-to-br from-blue-600 to-blue-800 text-white min-h-screen flex items-center justify-center p-16">
            <div className="text-center max-w-7xl mx-auto">
              <div className="mb-16">
                <h2 className="text-7xl font-black mb-6">SUB-PRAÇAS</h2>
                <h3 className="text-4xl font-light opacity-80">SEMANA {numeroSemana1} & {numeroSemana2}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-16">
                {semana1?.sub_praca?.slice(0, 4).map((subPraca: any, index: number) => {
                  const subPraca2 = semana2?.sub_praca?.find((sp: any) => sp.sub_praca === subPraca.sub_praca);
                  const aderencia1 = subPraca.aderencia_percentual || 0;
                  const aderencia2 = subPraca2?.aderencia_percentual || 0;
                  const horas1 = parseFloat(subPraca.horas_entregues || '0');
                  const horas2 = parseFloat(subPraca2?.horas_entregues || '0');
                  
                  return (
                    <div key={index} className="text-center">
                      <h4 className="text-3xl font-bold mb-6">{subPraca.sub_praca?.toUpperCase()}</h4>
                      <div className="text-xl mb-6 opacity-80">{parseFloat(subPraca.horas_a_entregar || '0').toFixed(2)}</div>
                      
                      <div className="flex justify-center gap-12">
                        {/* Semana 1 */}
                        <div>
                          <div className="relative w-32 h-32 mb-4">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="30" stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none" />
                              <circle
                                cx="50" cy="50" r="30"
                                stroke="#ffffff" strokeWidth="6" fill="none"
                                strokeDasharray={`${(aderencia1 / 100) * 188.4} 188.4`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <span className="text-lg font-bold leading-none block">{aderencia1.toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-lg font-bold">SEMANA {numeroSemana1}</div>
                          <div className="text-base">{formatarHorasParaHMS(horas1.toString())}</div>
                        </div>

                        {/* Semana 2 */}
                        <div>
                          <div className="relative w-32 h-32 mb-4">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="30" stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none" />
                              <circle
                                cx="50" cy="50" r="30"
                                stroke="#ffffff" strokeWidth="6" fill="none"
                                strokeDasharray={`${(aderencia2 / 100) * 188.4} 188.4`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <span className="text-lg font-bold leading-none block">{aderencia2.toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-lg font-bold">SEMANA {numeroSemana2}</div>
                          <div className="text-base">{formatarHorasParaHMS(horas2.toString())}</div>
                          <div className={`text-sm font-bold mt-2 ${calcularDiferenca(horas1, horas2) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                            {formatarDiferenca(calcularDiferenca(horas1, horas2), true)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Slide 4 - Aderência Diária - Semana 1 */}
          <div className="slide bg-gradient-to-br from-blue-600 to-blue-800 text-white min-h-screen flex items-center justify-center p-16">
            <div className="text-center max-w-7xl mx-auto">
              <div className="mb-20">
                <h2 className="text-7xl font-black mb-6">ADERÊNCIA DIÁRIA</h2>
                <h3 className="text-5xl font-bold mb-4">SEMANA {numeroSemana1}</h3>
                <h4 className="text-3xl font-light opacity-80">Análise por Dia da Semana</h4>
              </div>
              
              <div className="flex justify-center gap-8">
                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia, index) => {
                  const diaData = semana1?.dia?.find((d: any) => d.dia_da_semana === dia);
                  const aderencia = diaData?.aderencia_percentual || 0;
                  const horasEntregues = parseFloat(diaData?.horas_entregues || '0');
                  const horasPlanejadas = parseFloat(diaData?.horas_a_entregar || '0');
                  
                  return (
                    <div key={index} className="text-center bg-white bg-opacity-10 rounded-3xl p-6 min-w-[140px]">
                      <div className="text-xl font-bold mb-4 opacity-90">{dia.toUpperCase()}</div>
                      <div className="relative w-28 h-28 mx-auto mb-6">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="35" stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none" />
                          <circle
                            cx="50" cy="50" r="35"
                            stroke="#ffffff" strokeWidth="6" fill="none"
                            strokeDasharray={`${(aderencia / 100) * 219.8} 219.8`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <span className="text-2xl font-black leading-none block">{aderencia.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm opacity-80">Planejado: {horasPlanejadas.toFixed(1)}h</div>
                        <div className="text-base font-bold">{formatarHorasParaHMS(horasEntregues.toString())}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Slide 5 - Aderência Diária - Semana 2 com Comparação */}
          <div className="slide bg-gradient-to-br from-blue-600 to-blue-800 text-white min-h-screen flex items-center justify-center p-16">
            <div className="text-center max-w-7xl mx-auto">
              <div className="mb-20">
                <h2 className="text-7xl font-black mb-6">ADERÊNCIA DIÁRIA</h2>
                <h3 className="text-5xl font-bold mb-4">SEMANA {numeroSemana2}</h3>
                <h4 className="text-3xl font-light opacity-80">Comparação com Semana {numeroSemana1}</h4>
              </div>
              
              <div className="flex justify-center gap-8">
                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia, index) => {
                  const diaData1 = semana1?.dia?.find((d: any) => d.dia_da_semana === dia);
                  const diaData2 = semana2?.dia?.find((d: any) => d.dia_da_semana === dia);
                  const aderencia = diaData2?.aderencia_percentual || 0;
                  const horasEntregues1 = parseFloat(diaData1?.horas_entregues || '0');
                  const horasEntregues2 = parseFloat(diaData2?.horas_entregues || '0');
                  const horasPlanejadas = parseFloat(diaData2?.horas_a_entregar || '0');
                  const diferenca = calcularDiferenca(horasEntregues1, horasEntregues2);
                  
                  return (
                    <div key={index} className="text-center bg-white bg-opacity-10 rounded-3xl p-6 min-w-[140px]">
                      <div className="text-xl font-bold mb-4 opacity-90">{dia.toUpperCase()}</div>
                      <div className="relative w-28 h-28 mx-auto mb-6">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="35" stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none" />
                          <circle
                            cx="50" cy="50" r="35"
                            stroke="#ffffff" strokeWidth="6" fill="none"
                            strokeDasharray={`${(aderencia / 100) * 219.8} 219.8`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <span className="text-2xl font-black leading-none block">{aderencia.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm opacity-80">Planejado: {horasPlanejadas.toFixed(1)}h</div>
                        <div className="text-base font-bold">{formatarHorasParaHMS(horasEntregues2.toString())}</div>
                        <div className={`text-sm font-bold ${diferenca >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                          {formatarDiferenca(diferenca, true)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Slide 6 - Turnos */}
          <div className="slide bg-gradient-to-br from-blue-600 to-blue-800 text-white min-h-screen flex items-center justify-center p-16">
            <div className="text-center max-w-7xl mx-auto">
              <div className="mb-16">
                <h2 className="text-7xl font-black mb-6">ADERÊNCIA POR TURNO</h2>
                <h3 className="text-4xl font-light opacity-80">SEMANA {numeroSemana1} & {numeroSemana2}</h3>
              </div>
              
              <div className="space-y-12">
                {semana1?.turno?.map((turno: any, index: number) => {
                  const turno2 = semana2?.turno?.find((t: any) => t.periodo === turno.periodo);
                  const aderencia1 = turno.aderencia_percentual || 0;
                  const aderencia2 = turno2?.aderencia_percentual || 0;
                  const horas1 = parseFloat(turno.horas_entregues || '0');
                  const horas2 = parseFloat(turno2?.horas_entregues || '0');
                  const diferenca = calcularDiferenca(horas1, horas2);
                  const diferencaAderencia = calcularDiferenca(aderencia1, aderencia2);
                  
                  return (
                    <div key={index} className="bg-white bg-opacity-10 rounded-3xl p-8">
                      <div className="text-center mb-8">
                        <h4 className="text-4xl font-bold mb-2">{turno.periodo?.toUpperCase()}</h4>
                        <div className="text-xl opacity-80">Planejado: {parseFloat(turno.horas_a_entregar || '0').toFixed(2)}h</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-16 items-center">
                        {/* Semana 1 */}
                        <div className="text-center">
                          <div className="text-3xl font-bold mb-4">SEMANA {numeroSemana1}</div>
                          <div className="relative w-48 h-48 mx-auto mb-6">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="35" stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none" />
                              <circle
                                cx="50" cy="50" r="35"
                                stroke="#ffffff" strokeWidth="6" fill="none"
                                strokeDasharray={`${(aderencia1 / 100) * 219.8} 219.8`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <span className="text-3xl font-black leading-none block">{aderencia1.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-2xl font-medium">{formatarHorasParaHMS(horas1.toString())}</div>
                        </div>

                        {/* Semana 2 */}
                        <div className="text-center">
                          <div className="text-3xl font-bold mb-4">SEMANA {numeroSemana2}</div>
                          <div className="relative w-48 h-48 mx-auto mb-6">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="35" stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none" />
                              <circle
                                cx="50" cy="50" r="35"
                                stroke="#ffffff" strokeWidth="6" fill="none"
                                strokeDasharray={`${(aderencia2 / 100) * 219.8} 219.8`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <span className="text-3xl font-black leading-none block">{aderencia2.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-2xl font-medium">{formatarHorasParaHMS(horas2.toString())}</div>
                          <div className="mt-4 space-y-2">
                            <div className={`text-xl font-bold ${diferenca >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                              Horas: {formatarDiferenca(diferenca, true)}
                            </div>
                            <div className={`text-xl font-bold ${diferencaAderencia >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                              Aderência: {(() => {
                                const sinal = diferencaAderencia >= 0 ? '+' : '';
                                return `${sinal}${diferencaAderencia.toFixed(1)}%`;
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Slide 7 - Demanda e Rejeições */}
          <div className="slide bg-gradient-to-br from-blue-600 to-blue-800 text-white min-h-screen flex items-center justify-center p-16">
            <div className="text-center max-w-7xl mx-auto">
              <div className="mb-20">
                <h2 className="text-7xl font-black mb-6">DEMANDA E REJEITES</h2>
                <h3 className="text-4xl font-light opacity-80">SEMANA {numeroSemana1} & {numeroSemana2}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-24">
                {/* Semana 1 */}
                <div className="text-center">
                  <h4 className="text-5xl font-bold mb-12">SEMANA {numeroSemana1}</h4>
                  <div className="space-y-6 text-left max-w-md mx-auto">
                    <div className="text-3xl">
                      <span className="font-bold">OFERTADAS - </span>
                      <span className="font-black">{semana1?.totais?.corridas_ofertadas || 0}</span>
                    </div>
                    <div className="text-3xl">
                      <span className="font-bold">COMPLETADAS - </span>
                      <span className="font-black">{semana1?.totais?.corridas_completadas || 0}</span>
                    </div>
                    <div className="text-3xl">
                      <span className="font-bold">REJEITADAS - </span>
                      <span className="font-black">{semana1?.totais?.corridas_rejeitadas || 0}</span>
                    </div>
                  </div>
                  
                  <div className="mt-12">
                    <div className="w-64 h-16 bg-white bg-opacity-20 rounded-full overflow-hidden mx-auto">
                      <div 
                        className="h-full bg-white rounded-full flex items-center justify-center"
                        style={{ 
                          width: `${((semana1?.totais?.corridas_rejeitadas || 0) / (semana1?.totais?.corridas_ofertadas || 1)) * 100}%` 
                        }}
                      >
                        <span className="text-blue-800 font-black text-2xl">
                          {(((semana1?.totais?.corridas_rejeitadas || 0) / (semana1?.totais?.corridas_ofertadas || 1)) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-3xl font-bold mt-4">REJEITES</div>
                  </div>
                </div>

                {/* Semana 2 */}
                <div className="text-center">
                  <h4 className="text-5xl font-bold mb-12">SEMANA {numeroSemana2}</h4>
                  <div className="space-y-6 text-left max-w-md mx-auto">
                    <div className="text-3xl flex justify-between">
                      <span>
                        <span className="font-bold">OFERTADAS - </span>
                        <span className="font-black">{semana2?.totais?.corridas_ofertadas || 0}</span>
                      </span>
                      <span className="text-green-300 font-bold">
                        {formatarDiferenca(calcularDiferenca(semana1?.totais?.corridas_ofertadas || 0, semana2?.totais?.corridas_ofertadas || 0))}
                      </span>
                    </div>
                    <div className="text-3xl flex justify-between">
                      <span>
                        <span className="font-bold">COMPLETADAS - </span>
                        <span className="font-black">{semana2?.totais?.corridas_completadas || 0}</span>
                      </span>
                      <span className="text-green-300 font-bold">
                        {formatarDiferenca(calcularDiferenca(semana1?.totais?.corridas_completadas || 0, semana2?.totais?.corridas_completadas || 0))}
                      </span>
                    </div>
                    <div className="text-3xl flex justify-between">
                      <span>
                        <span className="font-bold">REJEITADAS - </span>
                        <span className="font-black">{semana2?.totais?.corridas_rejeitadas || 0}</span>
                      </span>
                      <span className={`font-bold ${calcularDiferenca(semana1?.totais?.corridas_rejeitadas || 0, semana2?.totais?.corridas_rejeitadas || 0) >= 0 ? 'text-red-300' : 'text-green-300'}`}>
                        {formatarDiferenca(calcularDiferenca(semana1?.totais?.corridas_rejeitadas || 0, semana2?.totais?.corridas_rejeitadas || 0))}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-12">
                    <div className="w-64 h-16 bg-white bg-opacity-20 rounded-full overflow-hidden mx-auto">
                      <div 
                        className="h-full bg-white rounded-full flex items-center justify-center"
                        style={{ 
                          width: `${((semana2?.totais?.corridas_rejeitadas || 0) / (semana2?.totais?.corridas_ofertadas || 1)) * 100}%` 
                        }}
                      >
                        <span className="text-blue-800 font-black text-2xl">
                          {(((semana2?.totais?.corridas_rejeitadas || 0) / (semana2?.totais?.corridas_ofertadas || 1)) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-3xl font-bold mt-4">REJEITES</div>
                    <div className={`text-2xl font-bold mt-4 ${
                      calcularDiferenca(
                        ((semana1?.totais?.corridas_rejeitadas || 0) / (semana1?.totais?.corridas_ofertadas || 1)) * 100,
                        ((semana2?.totais?.corridas_rejeitadas || 0) / (semana2?.totais?.corridas_ofertadas || 1)) * 100
                      ) >= 0 ? 'text-red-300' : 'text-green-300'
                    }`}>
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
    </div>
  );
}

export default ApresentacaoView;

export default ApresentacaoView;