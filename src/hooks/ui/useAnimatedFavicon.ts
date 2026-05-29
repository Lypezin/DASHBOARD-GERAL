'use client';

import { useEffect, useRef } from 'react';

interface AnimatedFaviconOptions {
  percentual: number; // 0 a 100
  activeColor?: string; // Cor do arco de progresso
}

export function useAnimatedFavicon({ percentual, activeColor }: AnimatedFaviconOptions) {
  const originalTitle = useRef<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Salvar o título original se ainda não estiver salvo
    if (!originalTitle.current) {
      originalTitle.current = document.title || 'Dashboard Geral';
    }

    // Inicializar canvas virtual para desenhar o favicon
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      canvasRef.current = canvas;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Função para atualizar a tag <link rel="icon"> do HTML
    const updateFaviconLink = (dataUrl: string) => {
      const links = document.querySelectorAll("link[rel*='icon']");
      if (links.length === 0) {
        const link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
        link.href = dataUrl;
      } else {
        links.forEach((link: any) => {
          link.href = dataUrl;
        });
      }
    };

    // Desenhar o Favicon padrão com progresso
    const drawFaviconWithProgress = (pct: number) => {
      ctx.clearRect(0, 0, 32, 32);

      // Definir a cor correspondente
      let color = activeColor || '#3B82F6'; // Azul cobalto padrão
      if (!activeColor) {
        if (pct >= 90) color = '#10B981'; // Verde para aderência alta
        else if (pct >= 75) color = '#3B82F6'; // Azul
        else color = '#EF4444'; // Vermelho para aderência crítica
      }

      // 1. Desenhar fundo circular para o logo
      ctx.beginPath();
      ctx.arc(16, 16, 14, 0, 2 * Math.PI);
      ctx.fillStyle = '#09090B'; // Fundo preto sofisticado
      ctx.fill();

      // 2. Desenhar trilha de progresso cinza sutil por trás
      ctx.beginPath();
      ctx.arc(16, 16, 12, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 3. Desenhar arco de progresso ativo
      const startAngle = -0.5 * Math.PI; // Topo
      const endAngle = startAngle + (pct / 100) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(16, 16, 12, startAngle, endAngle);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 4. Desenhar sigla central "DG"
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DG', 16, 16.5);

      updateFaviconLink(canvas.toDataURL('image/png'));
    };

    // Desenhar Favicon Inativo com ponto de notificação
    const drawFaviconInactive = () => {
      ctx.clearRect(0, 0, 32, 32);

      // Fundo circular para o logo
      ctx.beginPath();
      ctx.arc(16, 16, 14, 0, 2 * Math.PI);
      ctx.fillStyle = '#1F2937';
      ctx.fill();

      // Texto DG
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#9CA3AF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DG', 16, 16.5);

      // Ponto de notificação (alerta suave de ausência)
      ctx.beginPath();
      ctx.arc(26, 6, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#3B82F6'; // Azul primário chamando de volta
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();

      updateFaviconLink(canvas.toDataURL('image/png'));
    };

    // Renderizar inicialmente
    drawFaviconWithProgress(percentual);

    // Monitorar a visibilidade da aba
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.title = `DG • Volte para o painel! 👋`;
        drawFaviconInactive();
      } else {
        document.title = originalTitle.current;
        drawFaviconWithProgress(percentual);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Restaurar título ao desmontar
      if (typeof window !== 'undefined') {
        document.title = originalTitle.current;
      }
    };
  }, [percentual, activeColor]);
}
