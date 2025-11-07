import React, { useRef, useState, useEffect } from 'react';
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

const ApresentacaoView: React.FC<ApresentacaoViewProps> = ({
  dadosComparacao,
  semanasSelecionadas,
  pracaSelecionada,
  onClose,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);
  const [previewScale, setPreviewScale] = useState(0.5);

  useEffect(() => {
    const calculateScale = () => {
      if (previewContainerRef.current) {
        const { width, height } = previewContainerRef.current.getBoundingClientRect();
        // Baseado na proporção 16:9 (1920x1080)
        const scaleX = width / 1920;
        const scaleY = height / 1080;
        setPreviewScale(Math.min(scaleX, scaleY) * 0.95); // 95% para ter uma pequena margem
      }
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);

    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      const slides = contentRef.current.querySelectorAll('.slide');
      setTotalSlides(slides.length);
    }
  }, [dadosComparacao]); // Recalcula quando os dados mudam

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

  const calcularDiferencaPercentual = (valor1: number, valor2: number) => {
    if (valor1 === 0) return 0; // Evitar divisão por zero
    return ((valor2 - valor1) / valor1) * 100;
  };

  const formatarDiferencaPercentual = (diferenca: number) => {
    if (isNaN(diferenca) || !isFinite(diferenca)) {
      return "(0.0%)";
    }
    const sinal = diferenca >= 0 ? '+' : '';
    return `(${sinal}${diferenca.toFixed(1)}%)`;
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
    setIsGenerating(true);

    try {
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Buscar todos os slides
      const slides = contentRef.current.querySelectorAll('.slide');
      
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;
        
        // Criar um container temporário e off-screen
        const printContainer = document.createElement('div');
        printContainer.style.position = 'absolute';
        printContainer.style.left = '-9999px';
        printContainer.style.top = '0';
        
        // Clonar o slide e aplicar as dimensões fixas
        const clone = slide.cloneNode(true) as HTMLElement;
        clone.style.width = '1920px';
        clone.style.height = '1080px';
        
        printContainer.appendChild(clone);
        document.body.appendChild(printContainer);

        // Aguardar um momento para garantir a renderização do clone
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Capturar o clone com alta qualidade
        const canvas = await html2canvas(clone, {
          scale: 1.5, // Ótimo balanço entre qualidade e tamanho
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#3b82f6',
          width: 1920,
          height: 1080,
          logging: false,
          imageTimeout: 0,
          removeContainer: true,
          foreignObjectRendering: false,
          ignoreElements: (element) => {
            return element.tagName === 'IFRAME' || element.tagName === 'OBJECT';
          }
        });

        // Remover o container temporário do DOM
        document.body.removeChild(printContainer);

        // Converter para JPEG com 90% de qualidade para otimização
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        
        // Calcular dimensões para ocupar toda a página (sem bordas brancas)
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.max(pdfWidth / imgWidth, pdfHeight / imgHeight);
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
    } finally {
      setIsGenerating(false);
    }
  };

  const goToNextSlide = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {isGenerating && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50">
          <svg className="animate-spin h-16 w-16 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 className="text-white text-2xl font-bold">Gerando PDF, por favor aguarde...</h2>
          <p className="text-white text-lg mt-2">Isso pode levar alguns segundos.</p>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full h-[95vh] flex flex-col">
        {/* Header com botões */}
        <div className="sticky top-0 bg-white p-4 border-b border-slate-200 flex justify-between items-center z-10">
          <h3 className="text-xl font-bold text-slate-800">Preview da Apresentação</h3>
          <div className="flex items-center gap-4">
            {/* Controles de Navegação */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevSlide}
                disabled={currentSlide === 0}
                className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg shadow-sm hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-slate-600 font-medium text-sm">
                {currentSlide + 1} / {totalSlides}
              </span>
              <button
                onClick={goToNextSlide}
                disabled={currentSlide === totalSlides - 1}
                className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg shadow-sm hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
            <div className="h-6 w-px bg-slate-300"></div> {/* Separador */}
            <button
              onClick={gerarPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
              Gerar PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg shadow-md hover:bg-slate-300 transition-colors"
            >
              ✕ Fechar
            </button>
          </div>
        </div>

        {/* Conteúdo da apresentação */}
        <div ref={previewContainerRef} className="bg-slate-100 flex-1 overflow-hidden p-4 flex items-center justify-center">
          {/* Container do Slide com ajuste de escala dinâmico */}
          <div 
            ref={contentRef}
            className="relative"
            style={{ 
              width: '1920px', 
              height: '1080px', 
              transform: `scale(${previewScale})`,
              transformOrigin: 'center center',
            }}
          >
            {React.Children.toArray(
              <>
                {/* Slide 1 - Capa */}
                <div className="slide bg-gradient-to-br from-blue-600 to-blue-800 text-white w-full h-full flex items-center justify-center" style={{width: '1920px', height: '1080px'}}>
                  <div className="text-center w-full px-24">
                    <div className="mb-16">
                      <h1 className="text-[12rem] font-black mb-8 leading-none tracking-wider">RELATÓRIO DE</h1>
                      <h1 className="text-[12rem] font-black mb-20 leading-none tracking-wider">RESULTADOS</h1>
                    </div>
                    <div className="space-y-12">
                      <h2 className="text-7xl font-bold tracking-wide">{pracaSelecionada?.toUpperCase() || 'TODAS AS PRAÇAS'}</h2>
                      <h3 className="text-6xl font-semibold">SEMANA {numeroSemana1} & {numeroSemana2}</h3>
                      <div className="text-4xl font-medium opacity-90">
                        {new Date(new Date().getFullYear(), 0, 1 + (parseInt(numeroSemana1) - 1) * 7).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {new Date(new Date().getFullYear(), 0, 7 + (parseInt(numeroSemana1) - 1) * 7).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} & {new Date(new Date().getFullYear(), 0, 1 + (parseInt(numeroSemana2) - 1) * 7).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {new Date(new Date().getFullYear(), 0, 7 + (parseInt(numeroSemana2) - 1) * 7).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slide 2 - Aderência Geral */}
                <div className="slide bg-gradient-to-br from-blue-600 to-blue-800 text-white flex flex-col items-center justify-center p-12">
                  <div className="w-full text-center">
                    <h2 className="text-8xl font-black mb-4 tracking-wider">ADERÊNCIA GERAL</h2>
                    <h3 className="text-5xl font-light opacity-90 mb-16">SEMANA {numeroSemana1} & {numeroSemana2}</h3>
                  </div>
                  <div className="w-full flex justify-center items-start gap-16">
                    {/* Semana 1 */}
                    <div className="flex flex-col items-center">
                      <h4 className="text-6xl font-bold mb-8">SEMANA {numeroSemana1}</h4>
                      <div className="relative w-96 h-96 mb-8">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,0.2)" strokeWidth="10" fill="none" />
                          <circle
                            cx="60" cy="60" r="50"
                            stroke="#ffffff" strokeWidth="10" fill="none"
                            strokeDasharray={`${(aderencia1 / 100) * 314} 314`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-7xl font-black leading-none">{aderencia1.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="bg-white bg-opacity-15 rounded-3xl p-6 space-y-4 w-[450px]">
                        <div className="flex justify-between items-center text-3xl">
                          <span className="opacity-80">🎯 Planejado:</span>
                          <span className="font-bold text-4xl text-blue-200">{formatarHorasParaHMS(horasAEntregar.toString())}</span>
                        </div>
                        <div className="flex justify-between items-center text-3xl">
                          <span className="opacity-80">✅ Entregue:</span>
                          <span className="font-bold text-4xl text-green-300">{formatarHorasParaHMS(horasEntregues1.toString())}</span>
                        </div>
                        <div className="border-t border-white/20 my-4"></div>
                        <div className="space-y-3 text-2xl opacity-90">
                          <div className="flex justify-between items-center bg-white bg-opacity-10 rounded-xl p-3">
                            <span>📈 Taxa Aceitação:</span>
                            <span className="font-bold text-green-300">{semana1?.totais?.corridas_ofertadas ? ((semana1.totais.corridas_aceitas / semana1.totais.corridas_ofertadas) * 100).toFixed(1) : 0}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Semana 2 */}
                    <div className="flex flex-col items-center">
                      <h4 className="text-6xl font-bold mb-8">SEMANA {numeroSemana2}</h4>
                      <div className="relative w-96 h-96 mb-8">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,0.2)" strokeWidth="10" fill="none" />
                          <circle
                            cx="60" cy="60" r="50"
                            stroke="#ffffff" strokeWidth="10" fill="none"
                            strokeDasharray={`${(aderencia2 / 100) * 314} 314`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-7xl font-black leading-none">{aderencia2.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="bg-white bg-opacity-15 rounded-3xl p-6 space-y-4 w-[450px]">
                        <div className="flex justify-between items-center text-3xl">
                          <span className="opacity-80">🎯 Planejado:</span>
                          <span className="font-bold text-4xl text-blue-200">{formatarHorasParaHMS(horasAEntregar.toString())}</span>
                        </div>
                        <div className="text-3xl">
                          <div className="flex justify-between items-center">
                            <span className="opacity-80">✅ Entregue:</span>
                            <span className="font-bold text-4xl text-green-300">{formatarHorasParaHMS(horasEntregues2.toString())}</span>
                          </div>
                          <div className={`text-right text-2xl font-bold mt-1 ${calcularDiferenca(horasEntregues1, horasEntregues2) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                            {formatarDiferenca(calcularDiferenca(horasEntregues1, horasEntregues2), true)}
                          </div>
                        </div>
                        <div className="border-t border-white/20 my-4"></div>
                        <div className="space-y-3 text-2xl opacity-90">
                          <div className="flex justify-between items-center bg-white bg-opacity-10 rounded-xl p-3">
                            <span>📈 Taxa Aceitação:</span>
                            <div>
                              <span className="font-bold text-green-300">{semana2?.totais?.corridas_ofertadas ? ((semana2.totais.corridas_aceitas / semana2.totais.corridas_ofertadas) * 100).toFixed(1) : 0}%</span>
                              <span className={`ml-2 font-bold ${
                                calcularDiferenca(
                                  semana1?.totais?.corridas_ofertadas ? ((semana1.totais.corridas_aceitas / semana1.totais.corridas_ofertadas) * 100) : 0,
                                  semana2?.totais?.corridas_ofertadas ? ((semana2.totais.corridas_aceitas / semana2.totais.corridas_ofertadas) * 100) : 0
                                ) >= 0 ? 'text-green-300' : 'text-red-300'
                              }`}>
                                {formatarDiferencaPercentual(calcularDiferencaPercentual(
                                  semana1?.totais?.corridas_ofertadas ? ((semana1.totais.corridas_aceitas / semana1.totais.corridas_ofertadas) * 100) : 0,
                                  semana2?.totais?.corridas_ofertadas ? ((semana2.totais.corridas_aceitas / semana2.totais.corridas_ofertadas) * 100) : 0
                                ))}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center bg-white bg-opacity-10 rounded-xl p-3">
                            <span>❌ Rejeitadas:</span>
                            <div>
                              <span className="font-bold text-red-300">{semana2?.totais?.corridas_rejeitadas || 0}</span>
                              <span className={`ml-2 font-bold ${calcularDiferenca(semana1?.totais?.corridas_rejeitadas || 0, semana2?.totais?.corridas_rejeitadas || 0) >= 0 ? 'text-red-300' : 'text-green-300'}`}>
                                ({formatarDiferenca(calcularDiferenca(semana1?.totais?.corridas_rejeitadas || 0, semana2?.totais?.corridas_rejeitadas || 0))})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slide 3 - Sub-Praças */}
                <div className="slide bg-gradient-to-br from-blue-600 to-blue-800 text-white flex flex-col items-center justify-center p-12">
                  <div className="w-full text-center">
                    <h2 className="text-8xl font-black mb-4 tracking-wider">SUB-PRAÇAS</h2>
                    <h3 className="text-5xl font-light opacity-90 mb-16">SEMANA {numeroSemana1} & {numeroSemana2}</h3>
                  </div>
                  <div className="w-full grid grid-cols-3 gap-8">
                    {semana1?.sub_praca?.slice(0, 6).map((subPraca: any, index: number) => {
                      const subPraca2 = semana2?.sub_praca?.find((sp: any) => sp.sub_praca === subPraca.sub_praca);
                      const aderencia1 = subPraca.aderencia_percentual || 0;
                      const aderencia2 = subPraca2?.aderencia_percentual || 0;
                      const horas1 = parseFloat(subPraca.horas_entregues || '0');
                      const horas2 = parseFloat(subPraca2?.horas_entregues || '0');
                      
                      return (
                        <div key={index} className="bg-white bg-opacity-15 p-6 rounded-3xl flex flex-col items-center">
                          <h4 className="text-3xl font-bold mb-4 h-16 flex items-center text-center">{subPraca.sub_praca?.toUpperCase()}</h4>
                          <div className="text-xl mb-4 opacity-80">🎯 {parseFloat(subPraca.horas_a_entregar || '0').toFixed(2)}h</div>
                          <div className="w-full flex justify-around items-center">
                            {/* Semana 1 */}
                            <div className="text-center">
                              <div className="relative w-32 h-32 mb-3">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="50" cy="50" r="40"
                                    stroke="#ffffff" strokeWidth="8" fill="none"
                                    strokeDasharray={`${(aderencia1 / 100) * 251.2} 251.2`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-2xl font-black leading-none">{aderencia1.toFixed(1)}%</span>
                                </div>
                              </div>
                              <div className="text-xl font-bold">SEM {numeroSemana1}</div>
                              <div className="text-lg">{formatarHorasParaHMS(horas1.toString())}</div>
                            </div>

                            {/* Semana 2 */}
                            <div className="text-center">
                              <div className="relative w-32 h-32 mb-3">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="50" cy="50" r="40"
                                    stroke="#ffffff" strokeWidth="8" fill="none"
                                    strokeDasharray={`${(aderencia2 / 100) * 251.2} 251.2`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-2xl font-black leading-none">{aderencia2.toFixed(1)}%</span>
                                </div>
                              </div>
                              <div className="text-xl font-bold">SEM {numeroSemana2}</div>
                              <div className="text-lg">{formatarHorasParaHMS(horas2.toString())}</div>
                              <div className={`text-base font-bold mt-1 ${calcularDiferenca(horas1, horas2) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
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
                <div className="slide bg-gradient-to-br from-blue-600 to-blue-800 text-white flex flex-col items-center justify-center p-12">
                  <div className="w-full text-center">
                    <h2 className="text-8xl font-black mb-4 tracking-wider">ADERÊNCIA DIÁRIA</h2>
                    <h3 className="text-5xl font-light opacity-90 mb-10">SEMANA {numeroSemana1} & {numeroSemana2}</h3>
                  </div>
                  <div className="w-full space-y-8">
                    {/* Semana 1 */}
                    <div className="flex flex-col items-center">
                      <h4 className="text-4xl font-bold mb-6">SEMANA {numeroSemana1}</h4>
                      <div className="flex justify-center gap-6">
                        {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia, index) => {
                          const diaData = semana1?.dia?.find((d: any) => d.dia_da_semana === dia);
                          const aderencia = diaData?.aderencia_percentual || 0;
                          const horasEntregues = parseFloat(diaData?.horas_entregues || '0');
                          
                          return (
                            <div key={index} className="text-center bg-white bg-opacity-15 rounded-2xl p-4 w-48">
                              <div className="text-2xl font-bold mb-3 opacity-90">{dia.substring(0,3).toUpperCase()}</div>
                              <div className="relative w-28 h-28 mx-auto mb-3">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="50" cy="50" r="40"
                                    stroke="#ffffff" strokeWidth="8" fill="none"
                                    strokeDasharray={`${(aderencia / 100) * 251.2} 251.2`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-2xl font-black leading-none">{aderencia.toFixed(1)}%</span>
                                </div>
                              </div>
                              <div className="text-xl font-bold">{formatarHorasParaHMS(horasEntregues.toString())}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Semana 2 */}
                    <div className="flex flex-col items-center">
                      <h4 className="text-4xl font-bold mb-6">SEMANA {numeroSemana2}</h4>
                      <div className="flex justify-center gap-6">
                        {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia, index) => {
                          const diaData1 = semana1?.dia?.find((d: any) => d.dia_da_semana === dia);
                          const diaData2 = semana2?.dia?.find((d: any) => d.dia_da_semana === dia);
                          const aderencia = diaData2?.aderencia_percentual || 0;
                          const horasEntregues1 = parseFloat(diaData1?.horas_entregues || '0');
                          const horasEntregues2 = parseFloat(diaData2?.horas_entregues || '0');
                          const diferenca = calcularDiferenca(horasEntregues1, horasEntregues2);
                          
                          return (
                            <div key={index} className="text-center bg-white bg-opacity-15 rounded-2xl p-4 w-48">
                              <div className="text-2xl font-bold mb-3 opacity-90">{dia.substring(0,3).toUpperCase()}</div>
                              <div className="relative w-28 h-28 mx-auto mb-3">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                                  <circle
                                    cx="50" cy="50" r="40"
                                    stroke="#ffffff" strokeWidth="8" fill="none"
                                    strokeDasharray={`${(aderencia / 100) * 251.2} 251.2`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-2xl font-black leading-none">{aderencia.toFixed(1)}%</span>
                                </div>
                              </div>
                              <div className="text-xl font-bold">{formatarHorasParaHMS(horasEntregues2.toString())}</div>
                              <div className={`text-base font-bold mt-1 ${diferenca >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                {formatarDiferenca(diferenca, true)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slides de Turnos */}
                {semana1?.turno?.map((turno: any, index: number) => {
                  if (index % 2 !== 0) return null; // Processar em pares
                  
                  const turnoPar1 = turno;
                  const turnoPar2 = semana1.turno[index + 1];

                  return (
                    <div key={index} className="slide bg-gradient-to-br from-blue-600 to-blue-800 text-white flex flex-col items-center justify-center p-12">
                      <div className="w-full text-center">
                        <h2 className="text-8xl font-black mb-4 tracking-wider">ADERÊNCIA POR TURNO</h2>
                        <h3 className="text-5xl font-light opacity-90 mb-10">SEMANA {numeroSemana1} & {numeroSemana2}</h3>
                      </div>
                      <div className="w-full flex justify-center items-center gap-12">
                        {/* Card Turno 1 */}
                        <div className="bg-white bg-opacity-15 p-8 rounded-3xl w-[800px] flex flex-col items-center">
                          <h4 className="text-5xl font-bold mb-8">{turnoPar1.periodo?.toUpperCase()}</h4>
                          <div className="w-full flex justify-around">
                            {(() => {
                              const t1s1 = semana1?.turno?.find(t => t.periodo === turnoPar1.periodo);
                              const t1s2 = semana2?.turno?.find(t => t.periodo === turnoPar1.periodo);
                              const a1 = t1s1?.aderencia_percentual || 0;
                              const a2 = t1s2?.aderencia_percentual || 0;
                              const h1 = parseFloat(t1s1?.horas_entregues || '0');
                              const h2 = parseFloat(t1s2?.horas_entregues || '0');
                              return (
                                <>
                                  <div className="text-center">
                                    <div className="text-3xl font-bold mb-4">SEM {numeroSemana1}</div>
                                    <div className="relative w-48 h-48 mb-4">
                                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                                        <circle cx="50" cy="50" r="40" stroke="#ffffff" strokeWidth="8" fill="none" strokeDasharray={`${(a1 / 100) * 251.2} 251.2`} strokeLinecap="round" />
                                      </svg>
                                      <div className="absolute inset-0 flex items-center justify-center"><span className="text-4xl font-black leading-none">{a1.toFixed(1)}%</span></div>
                                    </div>
                                    <div className="text-2xl font-medium">{formatarHorasParaHMS(h1.toString())}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-3xl font-bold mb-4">SEM {numeroSemana2}</div>
                                    <div className="relative w-48 h-48 mb-4">
                                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                                        <circle cx="50" cy="50" r="40" stroke="#ffffff" strokeWidth="8" fill="none" strokeDasharray={`${(a2 / 100) * 251.2} 251.2`} strokeLinecap="round" />
                                      </svg>
                                      <div className="absolute inset-0 flex items-center justify-center"><span className="text-4xl font-black leading-none">{a2.toFixed(1)}%</span></div>
                                    </div>
                                    <div className="text-2xl font-medium">{formatarHorasParaHMS(h2.toString())}</div>
                                    <div className={`mt-2 text-xl font-bold ${calcularDiferenca(h1, h2) >= 0 ? 'text-green-300' : 'text-red-300'}`}>{formatarDiferenca(calcularDiferenca(h1, h2), true)}</div>
                                    <div className={`text-xl font-bold ${calcularDiferenca(a1, a2) >= 0 ? 'text-green-300' : 'text-red-300'}`}>{formatarDiferencaPercentual(calcularDiferencaPercentual(a1, a2))}</div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Card Turno 2 (se existir) */}
                        {turnoPar2 && (
                          <div className="bg-white bg-opacity-15 p-8 rounded-3xl w-[800px] flex flex-col items-center">
                            <h4 className="text-5xl font-bold mb-8">{turnoPar2.periodo?.toUpperCase()}</h4>
                            <div className="w-full flex justify-around">
                              {(() => {
                                const t2s1 = semana1?.turno?.find(t => t.periodo === turnoPar2.periodo);
                                const t2s2 = semana2?.turno?.find(t => t.periodo === turnoPar2.periodo);
                                const a1 = t2s1?.aderencia_percentual || 0;
                                const a2 = t2s2?.aderencia_percentual || 0;
                                const h1 = parseFloat(t2s1?.horas_entregues || '0');
                                const h2 = parseFloat(t2s2?.horas_entregues || '0');
                                return (
                                  <>
                                    <div className="text-center">
                                      <div className="text-3xl font-bold mb-4">SEM {numeroSemana1}</div>
                                      <div className="relative w-48 h-48 mb-4">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                          <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                                          <circle cx="50" cy="50" r="40" stroke="#ffffff" strokeWidth="8" fill="none" strokeDasharray={`${(a1 / 100) * 251.2} 251.2`} strokeLinecap="round" />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center"><span className="text-4xl font-black leading-none">{a1.toFixed(1)}%</span></div>
                                      </div>
                                      <div className="text-2xl font-medium">{formatarHorasParaHMS(h1.toString())}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-3xl font-bold mb-4">SEM {numeroSemana2}</div>
                                      <div className="relative w-48 h-48 mb-4">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                          <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                                          <circle cx="50" cy="50" r="40" stroke="#ffffff" strokeWidth="8" fill="none" strokeDasharray={`${(a2 / 100) * 251.2} 251.2`} strokeLinecap="round" />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center"><span className="text-4xl font-black leading-none">{a2.toFixed(1)}%</span></div>
                                      </div>
                                      <div className="text-2xl font-medium">{formatarHorasParaHMS(h2.toString())}</div>
                                      <div className={`mt-2 text-xl font-bold ${calcularDiferenca(h1, h2) >= 0 ? 'text-green-300' : 'text-red-300'}`}>{formatarDiferenca(calcularDiferenca(h1, h2), true)}</div>
                                      <div className={`text-xl font-bold ${calcularDiferenca(a1, a2) >= 0 ? 'text-green-300' : 'text-red-300'}`}>{formatarDiferencaPercentual(calcularDiferencaPercentual(a1, a2))}</div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}


                {/* Slide 7 - Demanda e Rejeições */}
                <div className="slide bg-gradient-to-br from-blue-600 to-blue-800 text-white flex flex-col items-center justify-center p-12">
                  <div className="w-full text-center">
                    <h2 className="text-6xl font-black mb-6">DEMANDA E REJEIÇÕES</h2>
                    <h3 className="text-5xl font-light opacity-90 mb-20">SEMANA {numeroSemana1} & {numeroSemana2}</h3>
                  </div>
                  <div className="w-full flex justify-center items-start gap-16">
                    {/* Semana 1 */}
                    <div className="flex flex-col items-center">
                      <h4 className="text-6xl font-bold mb-10">SEMANA {numeroSemana1}</h4>
                      <div className="space-y-6 w-[600px]">
                        <div className="flex justify-between items-center text-3xl bg-white bg-opacity-15 rounded-2xl p-5">
                          <span className="font-bold">OFERTADAS:</span>
                          <span className="font-black text-5xl">{semana1?.totais?.corridas_ofertadas || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-3xl bg-white bg-opacity-15 rounded-2xl p-5">
                          <span className="font-bold">ACEITAS:</span>
                          <span className="font-black text-5xl text-green-300">{semana1?.totais?.corridas_aceitas || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-3xl bg-white bg-opacity-15 rounded-2xl p-5">
                          <span className="font-bold">COMPLETADAS:</span>
                          <span className="font-black text-5xl text-blue-300">{semana1?.totais?.corridas_completadas || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-3xl bg-white bg-opacity-15 rounded-2xl p-5">
                          <span className="font-bold">REJEITADAS:</span>
                          <span className="font-black text-5xl text-red-300">{semana1?.totais?.corridas_rejeitadas || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Semana 2 */}
                    <div className="flex flex-col items-center">
                      <h4 className="text-6xl font-bold mb-10">SEMANA {numeroSemana2}</h4>
                      <div className="space-y-6 w-[600px]">
                        <div className="text-3xl bg-white bg-opacity-15 rounded-2xl p-5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold">OFERTADAS:</span>
                            <span className="font-black text-5xl">{semana2?.totais?.corridas_ofertadas || 0}</span>
                          </div>
                          <div className={`text-right text-2xl font-bold mt-1 ${calcularDiferenca(semana1?.totais?.corridas_ofertadas || 0, semana2?.totais?.corridas_ofertadas || 0) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                            {formatarDiferenca(calcularDiferenca(semana1?.totais?.corridas_ofertadas || 0, semana2?.totais?.corridas_ofertadas || 0))}
                          </div>
                        </div>
                        <div className="text-3xl bg-white bg-opacity-15 rounded-2xl p-5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold">ACEITAS:</span>
                            <span className="font-black text-5xl text-green-300">{semana2?.totais?.corridas_aceitas || 0}</span>
                          </div>
                          <div className={`text-right text-2xl font-bold mt-1 ${calcularDiferenca(semana1?.totais?.corridas_aceitas || 0, semana2?.totais?.corridas_aceitas || 0) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                            {formatarDiferencaPercentual(calcularDiferencaPercentual(
                              semana1?.totais?.corridas_ofertadas ? ((semana1.totais.corridas_aceitas / semana1.totais.corridas_ofertadas) * 100) : 0,
                              semana2?.totais?.corridas_ofertadas ? ((semana2.totais.corridas_aceitas / semana2.totais.corridas_ofertadas) * 100) : 0
                            ))}
                          </div>
                        </div>
                        <div className="text-3xl bg-white bg-opacity-15 rounded-2xl p-5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold">COMPLETADAS:</span>
                            <span className="font-black text-5xl text-blue-300">{semana2?.totais?.corridas_completadas || 0}</span>
                          </div>
                          <div className={`text-right text-2xl font-bold mt-1 ${calcularDiferenca(semana1?.totais?.corridas_completadas || 0, semana2?.totais?.corridas_completadas || 0) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                            {formatarDiferenca(calcularDiferenca(semana1?.totais?.corridas_completadas || 0, semana2?.totais?.corridas_completadas || 0))}
                          </div>
                        </div>
                        <div className="text-3xl bg-white bg-opacity-15 rounded-2xl p-5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold">REJEITADAS:</span>
                            <span className="font-black text-5xl text-red-300">{semana2?.totais?.corridas_rejeitadas || 0}</span>
                          </div>
                          <div className={`text-right text-2xl font-bold mt-1 ${calcularDiferenca(semana1?.totais?.corridas_rejeitadas || 0, semana2?.totais?.corridas_rejeitadas || 0) >= 0 ? 'text-red-300' : 'text-green-300'}`}>
                            {formatarDiferencaPercentual(calcularDiferencaPercentual(
                              semana1?.totais?.corridas_rejeitadas || 0,
                              semana2?.totais?.corridas_rejeitadas || 0
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ).map((child, index) => (
              <div 
                key={index}
                className="absolute inset-0 transition-opacity duration-300 ease-in-out"
                style={{
                  opacity: currentSlide === index ? 1 : 0,
                  visibility: currentSlide === index ? 'visible' : 'hidden',
                }}
              >
                {child}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApresentacaoView;