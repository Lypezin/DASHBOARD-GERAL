import React from 'react';
import { Users } from 'lucide-react';

export const EntregadoresEmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl border-dashed border-slate-300 dark:border-slate-700">
    <Users className="h-10 w-10 text-slate-400 mb-3" />
    <p className="text-lg font-medium text-slate-900 dark:text-white">Nenhum entregador encontrado</p>
    <p className="text-sm text-slate-500">Tente ajustar os filtros para ver mais resultados.</p>
  </div>
);
