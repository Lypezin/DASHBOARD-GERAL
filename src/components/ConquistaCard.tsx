import React, { memo } from 'react';
import type { Conquista } from '@/types/conquistas';

interface ConquistaCardProps {
  conquista: Conquista;
  getRaridadeColor: (raridade: string) => string;
  getRaridadeLabel: (raridade: string) => string;
  getCategoriaLabel: (categoria: string) => string;
}

const ConquistaCard = memo(({ conquista, getRaridadeColor, getRaridadeLabel, getCategoriaLabel }: ConquistaCardProps) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 p-4 transition-all hover:shadow-lg ${
        conquista.conquistada
          ? 'bg-white border-blue-200 dark:bg-slate-800 dark:border-blue-700'
          : 'bg-gray-50 border-gray-200 dark:bg-slate-900/50 dark:border-gray-700 opacity-60'
      }`}
      style={{ willChange: 'transform', transform: 'translateZ(0)' }}
    >
      {/* Badge de raridade */}
      <div className="absolute top-2 right-2">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getRaridadeColor(conquista.raridade)} shadow-md`}>
          {getRaridadeLabel(conquista.raridade).split(' ')[0]}
        </span>
      </div>

      {/* Ícone */}
      <div className="flex items-start gap-3">
        <div className={`flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${getRaridadeColor(conquista.raridade)} shadow-lg ${conquista.conquistada ? '' : 'grayscale opacity-50'}`}>
          <span className="text-3xl">{conquista.icone}</span>
        </div>

        {/* Informações */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
            {conquista.nome}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
            {conquista.descricao}
          </p>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {getCategoriaLabel(conquista.categoria)}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              {conquista.pontos} pts
            </span>
            {conquista.conquistada && conquista.conquistada_em && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(conquista.conquistada_em).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>

          {/* Barra de progresso */}
          {!conquista.conquistada && conquista.progresso > 0 && (
            <div className="mt-2">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${conquista.progresso}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                {conquista.progresso}% concluído
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Selo de conquistada */}
      {conquista.conquistada && (
        <div className="absolute bottom-2 right-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Conquistada
          </span>
        </div>
      )}
    </div>
  );
});

ConquistaCard.displayName = 'ConquistaCard';

export default ConquistaCard;

