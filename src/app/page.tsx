"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Totals {
  ofertadas: number;
  aceitas: number;
  rejeitadas: number;
  completadas: number;
}

export default function DashboardPage() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTotals() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('dados_corridas')
        .select('numero_de_corridas_ofertadas, numero_de_corridas_aceitas, numero_de_corridas_rejeitadas, numero_de_corridas_completadas');

      if (error) {
        console.error('Erro ao buscar dados:', error);
        setError('Não foi possível carregar os dados. Verifique a conexão com o Supabase.');
        setTotals(null);
      } else if (data) {
        const calculatedTotals = data.reduce(
          (acc, row) => {
            acc.ofertadas += row.numero_de_corridas_ofertadas || 0;
            acc.aceitas += row.numero_de_corridas_aceitas || 0;
            acc.rejeitadas += row.numero_de_corridas_rejeitadas || 0;
            acc.completadas += row.numero_de_corridas_completadas || 0;
            return acc;
          },
          { ofertadas: 0, aceitas: 0, rejeitadas: 0, completadas: 0 }
        );
        setTotals(calculatedTotals);
      }
      setLoading(false);
    }

    fetchTotals();
  }, []);

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard de Corridas</h1>

      {loading && <p>Carregando dados...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {totals && !loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card title="Corridas Ofertadas" value={totals.ofertadas} />
          <Card title="Corridas Aceitas" value={totals.aceitas} />
          <Card title="Corridas Rejeitadas" value={totals.rejeitadas} />
          <Card title="Corridas Completadas" value={totals.completadas} />
        </div>
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
