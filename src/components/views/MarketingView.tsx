'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DadosMarketing } from '@/types';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

// Formatar data de YYYY-MM-DD para DD/MM/YYYY
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  
  try {
    // Se já estiver no formato DD/MM/YYYY, retornar como está
    if (typeof dateStr === 'string' && dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateStr;
    }
    
    // Tentar formato YYYY-MM-DD
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const parts = dateStr.split('T')[0].split('-'); // Remove hora se houver
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
      }
    }
    
    // Tentar parsear como Date
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    return dateStr;
  } catch (e) {
    console.warn('Erro ao formatar data:', dateStr, e);
    return dateStr || '-';
  }
}

const MarketingView = React.memo(function MarketingView() {
  const [data, setData] = useState<DadosMarketing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: marketingData, error: fetchError } = await supabase
          .from('dados_marketing')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        if (IS_DEV && marketingData && marketingData.length > 0) {
          console.log('Dados recebidos do banco:', marketingData.slice(0, 2));
          console.log('Exemplo de data_liberacao:', marketingData[0]?.data_liberacao, typeof marketingData[0]?.data_liberacao);
          console.log('Exemplo de data_envio:', marketingData[0]?.data_envio, typeof marketingData[0]?.data_envio);
        }
        setData(marketingData || []);
      } catch (err: any) {
        safeLog.error('Erro ao buscar dados de Marketing:', err);
        setError(err.message || 'Erro ao carregar dados de Marketing');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
          <p className="mt-4 text-lg font-semibold text-purple-700 dark:text-purple-200">Carregando dados de Marketing...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="max-w-md mx-auto rounded-xl border border-rose-200 bg-white p-6 text-center shadow-xl dark:border-rose-900 dark:bg-slate-900">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-lg font-bold text-rose-900 dark:text-rose-100">Erro ao carregar dados</p>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">Nenhum dado de Marketing encontrado</p>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
          Faça upload de uma planilha de Marketing na página de Upload para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-6 dark:border-purple-900 dark:from-purple-950/30 dark:to-pink-950/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100">Dados de Marketing</h2>
            <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
              Total de {data.length} registro(s)
            </p>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">ID Entregador</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Região</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Data Liberação</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">SubPraça 2.0</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Telefone Trabalho</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Outro Telefone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Data Envio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {data.map((item) => (
              <tr
                key={item.id}
                className="transition-colors hover:bg-purple-50/50 dark:hover:bg-purple-950/20"
              >
                <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                  {item.nome || '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                    {item.status || '-'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-slate-900 dark:text-slate-100">
                  {item.id_entregador}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                  {item.regiao_atuacao || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                  {item.data_liberacao ? formatDate(item.data_liberacao) : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                  {item.sub_praca_abc || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                  {item.telefone_trabalho || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                  {item.outro_telefone || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                  {item.data_envio ? formatDate(item.data_envio) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer com informações */}
      <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-center dark:border-purple-900 dark:bg-purple-950/30">
        <p className="text-sm text-purple-700 dark:text-purple-300">
          💡 Dica: Para atualizar os dados, faça upload de uma nova planilha na página de Upload.
        </p>
      </div>
    </div>
  );
});

MarketingView.displayName = 'MarketingView';

export default MarketingView;

