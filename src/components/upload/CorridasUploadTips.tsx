/**
 * Componente de dicas e informações para upload de corridas
 */

import { COLUMN_MAP } from '@/constants/upload';

export function CorridasUploadTips() {
  return (
    <>
      {/* Informações e Dicas */}
      <div className="mt-8 rounded-xl bg-blue-50 p-6 dark:bg-blue-950/30">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <h3 className="font-bold text-blue-900 dark:text-blue-100">Dicas importantes</h3>
            <ul className="mt-3 space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-600">•</span>
                <span>Certifique-se de que a planilha contém todas as colunas necessárias</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-600">•</span>
                <span>O sistema processa automaticamente grandes volumes de dados</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-600">•</span>
                <span>Aguarde a conclusão do upload antes de navegar para outra página</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-600">•</span>
                <span>Após o upload, os dados estarão disponíveis imediatamente no dashboard</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Colunas Esperadas */}
      <details className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
        <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
          📋 Ver colunas esperadas na planilha
        </summary>
        <div className="mt-4 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          {Object.keys(COLUMN_MAP).map((col) => (
            <div
              key={col}
              className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 dark:bg-slate-900"
            >
              <span className="text-blue-600">✓</span>
              <code className="text-xs text-slate-700 dark:text-slate-300">{col}</code>
            </div>
          ))}
        </div>
      </details>
    </>
  );
}

