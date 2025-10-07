"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Totals {
  ofertadas: number;
  aceitas: number;
  rejeitadas: number;
  completadas: number;
}

interface AderenciaSemanal {
  semana: string;
  horas_a_entregar: string;
  horas_entregues: string;
  aderencia_percentual: number;
}

interface DashboardTotalsRow {
  corridas_ofertadas: number | string | null;
  corridas_aceitas: number | string | null;
  corridas_rejeitadas: number | string | null;
  corridas_completadas: number | string | null;
}

export default function DashboardPage() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [aderencia, setAderencia] = useState<AderenciaSemanal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      // Buscar totais de corridas
      const { data: totalsData, error: totalsError } = await supabase.rpc('dashboard_totals');

      if (totalsError) {
        console.error('Erro ao buscar totais:', totalsError);
        setError('Não foi possível carregar os dados. Verifique a conexão com o Supabase.');
        setTotals(null);
      } else if (totalsData && Array.isArray(totalsData) && totalsData.length > 0) {
        const totalsRow = totalsData[0] as DashboardTotalsRow;
        const safeNumber = (value: number | string | null | undefined) =>
          value === null || value === undefined ? 0 : Number(value);

        setTotals({
          ofertadas: safeNumber(totalsRow.corridas_ofertadas),
          aceitas: safeNumber(totalsRow.corridas_aceitas),
          rejeitadas: safeNumber(totalsRow.corridas_rejeitadas),
          completadas: safeNumber(totalsRow.corridas_completadas),
        });
      } else {
        setTotals({ ofertadas: 0, aceitas: 0, rejeitadas: 0, completadas: 0 });
      }

      // Buscar dados de aderência
      const { data: aderenciaData, error: aderenciaError } = await supabase.rpc('calcular_aderencia_semanal');

      if (aderenciaError) {
        console.error('Erro ao buscar aderência:', aderenciaError);
        setAderencia([]);
      } else {
        setAderencia((aderenciaData as AderenciaSemanal[]) || []);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard de Corridas</h1>

      {loading && <p>Carregando dados...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {totals && !loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card title="Corridas Ofertadas" value={totals.ofertadas} />
            <Card title="Corridas Aceitas" value={totals.aceitas} />
            <Card title="Corridas Rejeitadas" value={totals.rejeitadas} />
            <Card title="Corridas Completadas" value={totals.completadas} />
          </div>

          <AderenciaSection aderencia={aderencia} />
        </>
      )}
    </div>
  );
}

interface CardProps {
  title: string;
  value: number;
}

function Card({ title, value }: CardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value.toLocaleString('pt-BR')}</p>
    </div>
  );
}

interface AderenciaSectionProps {
  aderencia: AderenciaSemanal[];
}

function AderenciaSection({ aderencia }: AderenciaSectionProps) {
  if (aderencia.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Aderência Semanal</h2>
        <p className="text-gray-500">Nenhum dado de aderência disponível.</p>
      </div>
    );
  }

  // Pega apenas a primeira semana (mais recente)
  const semanaAtual = aderencia[0];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Aderência Semanal</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="text-center">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            {semanaAtual.semana}
          </h3>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Horas a Entregar</p>
              <p className="text-lg font-semibold text-blue-600">
                {semanaAtual.horas_a_entregar}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Horas Entregues</p>
              <p className="text-lg font-semibold text-green-600">
                {semanaAtual.horas_entregues}
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Percentual de Aderência
          </h3>
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              {/* Fundo do círculo */}
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              {/* Barra de progresso */}
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={semanaAtual.aderencia_percentual >= 80 ? "#10b981" : semanaAtual.aderencia_percentual >= 60 ? "#f59e0b" : "#ef4444"}
                strokeWidth="2"
                strokeDasharray={`${semanaAtual.aderencia_percentual}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${
                semanaAtual.aderencia_percentual >= 80 ? "text-green-600" :
                semanaAtual.aderencia_percentual >= 60 ? "text-yellow-600" : "text-red-600"
              }`}>
                {semanaAtual.aderencia_percentual}%
              </span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Status
          </h3>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            semanaAtual.aderencia_percentual >= 80 ? "bg-green-100 text-green-800" :
            semanaAtual.aderencia_percentual >= 60 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
          }`}>
            {semanaAtual.aderencia_percentual >= 80 ? "Excelente" :
             semanaAtual.aderencia_percentual >= 60 ? "Bom" : "Precisa Melhorar"}
          </div>
        </div>
      </div>

      {/* Tabela com todas as semanas */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-3">Histórico Semanal</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Semana
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horas a Entregar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horas Entregues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aderência
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {aderencia.slice(0, 10).map((semana, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {semana.semana}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {semana.horas_a_entregar}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {semana.horas_entregues}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {semana.aderencia_percentual}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      semana.aderencia_percentual >= 80 ? "bg-green-100 text-green-800" :
                      semana.aderencia_percentual >= 60 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                    }`}>
                      {semana.aderencia_percentual >= 80 ? "Excelente" :
                       semana.aderencia_percentual >= 60 ? "Bom" : "Precisa Melhorar"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
