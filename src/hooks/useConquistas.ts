import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Conquista, ConquistaNova } from '@/types/conquistas';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useConquistas() {
  const [conquistas, setConquistas] = useState<Conquista[]>([]);
  const [conquistasNovas, setConquistasNovas] = useState<ConquistaNova[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPontos, setTotalPontos] = useState(0);

  // Carregar conquistas do usuário
  const carregarConquistas = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('listar_conquistas_usuario');
      
      if (error) {
        if (IS_DEV) console.error('Erro ao carregar conquistas:', error);
        return;
      }

      if (data) {
        setConquistas(data as Conquista[]);
        
        // Calcular total de pontos
        const pontos = (data as Conquista[])
          .filter(c => c.conquistada)
          .reduce((sum, c) => sum + c.pontos, 0);
        setTotalPontos(pontos);
      }
    } catch (err) {
      if (IS_DEV) console.error('Erro ao processar conquistas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Verificar novas conquistas
  const verificarConquistas = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('verificar_conquistas');
      
      if (error) {
        if (IS_DEV) console.error('Erro ao verificar conquistas:', error);
        return;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        setConquistasNovas(data as ConquistaNova[]);
        // Recarregar lista de conquistas
        await carregarConquistas();
      }
    } catch (err) {
      if (IS_DEV) console.error('Erro ao verificar conquistas:', err);
    }
  }, [carregarConquistas]);

  // Marcar conquista como visualizada
  const marcarVisualizada = useCallback(async (conquistaId: string) => {
    try {
      const { error } = await supabase.rpc('marcar_conquista_visualizada', {
        p_conquista_id: conquistaId
      });
      
      if (error) {
        if (IS_DEV) console.error('Erro ao marcar conquista:', error);
        return false;
      }

      // Atualizar estado local
      setConquistas(prev =>
        prev.map(c =>
          c.conquista_id === conquistaId ? { ...c, visualizada: true } : c
        )
      );

      return true;
    } catch (err) {
      if (IS_DEV) console.error('Erro ao marcar conquista:', err);
      return false;
    }
  }, []);

  // Remover conquista nova da lista de notificações
  const removerConquistaNova = useCallback((codigo: string) => {
    setConquistasNovas(prev => prev.filter(c => c.conquista_codigo !== codigo));
  }, []);

  // Carregar conquistas ao montar
  useEffect(() => {
    carregarConquistas();
  }, [carregarConquistas]);

  // Verificar conquistas periodicamente (a cada 30 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      verificarConquistas();
    }, 30000);

    return () => clearInterval(interval);
  }, [verificarConquistas]);

  // Estatísticas
  const stats = {
    total: conquistas.length,
    conquistadas: conquistas.filter(c => c.conquistada).length,
    pontos: totalPontos,
    progresso: conquistas.length > 0 
      ? Math.round((conquistas.filter(c => c.conquistada).length / conquistas.length) * 100)
      : 0
  };

  return {
    conquistas,
    conquistasNovas,
    loading,
    stats,
    carregarConquistas,
    verificarConquistas,
    marcarVisualizada,
    removerConquistaNova
  };
}

