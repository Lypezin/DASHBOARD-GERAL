import React, { useEffect, useState, useCallback } from 'react';
import type { ConquistaNova } from '@/types/conquistas';

interface ConquistaNotificacaoProps {
  conquista: ConquistaNova;
  onClose: () => void;
}

export default function ConquistaNotificacao({ conquista, onClose }: ConquistaNotificacaoProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    // Animar entrada
    setTimeout(() => setVisible(true), 100);

    // Auto-fechar após 5 segundos
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [handleClose]);

  const getRaridadeColor = () => {
    // Baseado nos pontos, deduzir raridade
    if (conquista.conquista_pontos >= 150) return 'from-yellow-400 to-orange-500'; // Lendária
    if (conquista.conquista_pontos >= 75) return 'from-purple-400 to-pink-500'; // Épica
    if (conquista.conquista_pontos >= 30) return 'from-blue-400 to-cyan-500'; // Rara
    return 'from-gray-400 to-gray-500'; // Comum
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-[9999] max-w-sm transform transition-all duration-300 ${
        visible && !exiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-800 border-2 border-yellow-400 dark:border-yellow-500">
        {/* Barra de progresso */}
        <div className="h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 animate-pulse" />
        
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">
                  Conquista Desbloqueada!
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Fechar notificação"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Conteúdo */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${getRaridadeColor()} shadow-lg transform hover:scale-110 transition-transform`}>
              <span className="text-4xl filter drop-shadow-lg">{conquista.conquista_icone}</span>
            </div>
            
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {conquista.conquista_nome}
              </h4>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  +{conquista.conquista_pontos} pontos
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer com animação */}
        <div className="h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer" />
      </div>

      {/* Confetti effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-yellow-400 animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: `${1 + Math.random()}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}

