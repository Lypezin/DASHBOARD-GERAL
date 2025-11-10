import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UsuarioOnline } from '@/types';
import MetricCard from '../MetricCard';
import { safeLog, getSafeErrorMessage } from '@/lib/errorHandler';
import { sanitizeText } from '@/lib/sanitize';

const IS_DEV = process.env.NODE_ENV === 'development';

// Interfaces para as novas funcionalidades
interface EstatisticasPeriodo {
  total_acoes: number;
  usuarios_unicos: number;
  acoes_por_hora: number;
  aba_mais_usada: string | null;
  pico_atividade: string | null;
  periodo_mais_ativo: string | null;
}

interface DistribuicaoHora {
  hora: number;
  total_acoes: number;
  usuarios_unicos: number;
}

interface TopUsuario {
  user_id: string;
  user_name: string;
  user_email: string;
  total_acoes: number;
  abas_diferentes: number;
  ultima_atividade: string;
}

interface DistribuicaoAba {
  tab_name: string;
  total_acoes: number;
  usuarios_unicos: number;
  percentual: number;
}

interface Alerta {
  tipo_alerta: string;
  mensagem: string;
  severidade: 'info' | 'warning' | 'error';
  valor_atual: number;
  valor_esperado: number;
}

interface Atividade {
  id?: string;
  user_id: string;
  action_type: string;
  action_details?: string;
  tab_name?: string;
  filters_applied?: unknown;
  created_at: string;
  session_id?: string;
}

function MonitoramentoView() {
  const [usuarios, setUsuarios] = useState<UsuarioOnline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  
  // Novos estados para funcionalidades avançadas
  const [estatisticas, setEstatisticas] = useState<EstatisticasPeriodo | null>(null);
  const [distribuicaoHora, setDistribuicaoHora] = useState<DistribuicaoHora[]>([]);
  const [topUsuarios, setTopUsuarios] = useState<TopUsuario[]>([]);
  const [distribuicaoAba, setDistribuicaoAba] = useState<DistribuicaoAba[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [periodoAnalise, setPeriodoAnalise] = useState<'24h' | '7d' | '30d'>('24h');
  const [mostrarAnalytics, setMostrarAnalytics] = useState(true);
  const [filtroUsuario, setFiltroUsuario] = useState<string>('');
  const [filtroAba, setFiltroAba] = useState<string>('');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calcular datas baseado no período selecionado
  const getPeriodoDatas = useCallback((periodo: '24h' | '7d' | '30d') => {
    const agora = new Date();
    const inicio = new Date();
    
    switch (periodo) {
      case '24h':
        inicio.setHours(inicio.getHours() - 24);
        break;
      case '7d':
        inicio.setDate(inicio.getDate() - 7);
        break;
      case '30d':
        inicio.setDate(inicio.getDate() - 30);
        break;
    }
    
    return {
      inicio: inicio.toISOString(),
      fim: agora.toISOString()
    };
  }, []);

  // Buscar estatísticas avançadas
  const fetchEstatisticas = useCallback(async () => {
    try {
      const { inicio, fim } = getPeriodoDatas(periodoAnalise);
      
      const [statsResult, horaResult, topResult, abaResult, alertasResult] = await Promise.allSettled([
        supabase.rpc('estatisticas_atividade_periodo', {
          p_data_inicio: inicio,
          p_data_fim: fim
        }),
        supabase.rpc('distribuicao_atividades_hora', {
          p_data_inicio: inicio,
          p_data_fim: fim
        }),
        supabase.rpc('top_usuarios_ativos', {
          p_limite: 10,
          p_data_inicio: inicio,
          p_data_fim: fim
        }),
        supabase.rpc('distribuicao_por_aba', {
          p_data_inicio: inicio,
          p_data_fim: fim
        }),
        supabase.rpc('verificar_alertas_monitoramento')
      ]);

      if (statsResult.status === 'fulfilled' && !statsResult.value.error) {
        setEstatisticas(statsResult.value.data?.[0] || null);
      }

      if (horaResult.status === 'fulfilled' && !horaResult.value.error) {
        setDistribuicaoHora(horaResult.value.data || []);
      }

      if (topResult.status === 'fulfilled' && !topResult.value.error) {
        setTopUsuarios(topResult.value.data || []);
      }

      if (abaResult.status === 'fulfilled' && !abaResult.value.error) {
        setDistribuicaoAba(abaResult.value.data || []);
      }

      if (alertasResult.status === 'fulfilled' && !alertasResult.value.error) {
        setAlertas(alertasResult.value.data || []);
      }
    } catch (err) {
      safeLog.warn('Erro ao buscar estatísticas avançadas:', err);
    }
  }, [periodoAnalise, getPeriodoDatas]);

  const fetchMonitoramento = useCallback(async () => {
    try {
      setError(null);
      
      // Buscar usuários online
      const { data, error } = await supabase.rpc('listar_usuarios_online');
      
      if (error) {
        safeLog.error('Erro ao buscar usuários online:', error);
        const errorWithCode = error as { code?: string };
        if (errorWithCode.code === '42883') {
          safeLog.error('Função listar_usuarios_online não existe no banco de dados.');
          setError('Função de monitoramento não configurada. Entre em contato com o administrador.');
        } else {
          setError(getSafeErrorMessage(error) || 'Erro ao carregar usuários online. Tente novamente.');
        }
        setUsuarios([]);
        return;
      }
      
      // Validar dados recebidos
      if (!data || !Array.isArray(data)) {
        safeLog.warn('Dados de usuários online inválidos:', data);
        setUsuarios([]);
        return;
      }
      
      if (data.length > 0) {
        safeLog.info(`✅ ${data.length} usuário(s) online encontrado(s)`);
      }
      
      // Buscar atividades recentes (últimas 100) - com tratamento de erro não bloqueante
      let atividadesData: Atividade[] = [];
      try {
        const { data: atividadesResponse, error: atividadesError } = await supabase
          .from('user_activity')
          .select('id, user_id, action_type, action_details, tab_name, filters_applied, created_at, session_id')
          .order('created_at', { ascending: false })
          .limit(100);
      
        if (atividadesError) {
          safeLog.warn('Erro ao buscar atividades:', atividadesError);
          if (atividadesError.code === '42P01') {
            safeLog.warn('Tabela user_activity não existe. As atividades serão registradas quando a tabela for criada.');
          }
          setAtividades([]);
        } else if (atividadesResponse && Array.isArray(atividadesResponse)) {
          atividadesData = atividadesResponse as Atividade[];
          setAtividades(atividadesData);
          if (atividadesData.length > 0) {
            safeLog.info(`✅ ${atividadesData.length} atividades carregadas`);
          }
        } else {
          setAtividades([]);
        }
      } catch (err: unknown) {
        safeLog.warn('Erro ao buscar atividades (pode não estar disponível):', err);
        setAtividades([]);
      }
      
      // Mapear os dados da API para o formato esperado com validações
      interface FiltersApplied {
        p_praca?: string | string[];
        praca?: string | string[];
        [key: string]: unknown;
      }
      
      interface UsuarioOnlineRaw {
        user_id: string;
        user_name?: string;
        user_email?: string;
        current_tab?: string;
        filters_applied?: FiltersApplied | null;
        last_action_type?: string;
        action_details?: string;
        seconds_inactive?: number;
        is_active?: boolean;
      }
      
      const usuariosMapeados: UsuarioOnline[] = (data || []).map((u: UsuarioOnlineRaw): UsuarioOnline | null => {
        if (!u || !u.user_id) return null;
        
        const segundosInativo = typeof u.seconds_inactive === 'number' ? u.seconds_inactive : 0;
        
        const filtros: FiltersApplied = (u.filters_applied as FiltersApplied) || {};
        let pracas: string[] = [];
        if (filtros.p_praca) {
          pracas = Array.isArray(filtros.p_praca) ? filtros.p_praca : [filtros.p_praca];
        } else if (filtros.praca) {
          pracas = Array.isArray(filtros.praca) ? filtros.praca : [filtros.praca];
        }
        
        const descricaoAcao = u.action_details || u.last_action_type || 'Atividade desconhecida';
        
        const umaHoraAtras = new Date();
        umaHoraAtras.setHours(umaHoraAtras.getHours() - 1);
        const acoesUltimaHora = atividadesData.filter((a: Atividade) => 
          a && a.user_id === u.user_id && a.created_at && new Date(a.created_at) > umaHoraAtras
        ).length;
        
        const userName = u.user_name || (u.user_email ? u.user_email.split('@')[0] : 'Usuário');
        const userEmail = u.user_email || '';
        
        return {
          user_id: u.user_id || '',
          nome: sanitizeText(userName),
          email: sanitizeText(userEmail),
          aba_atual: u.current_tab || null,
          pracas: pracas,
          ultima_acao: descricaoAcao,
          filtros: filtros,
          ultima_atividade: u.last_action_type || descricaoAcao,
          segundos_inativo: Math.floor(Math.max(0, segundosInativo)),
          acoes_ultima_hora: acoesUltimaHora,
          is_active: u.is_active !== false
        } as UsuarioOnline;
      }).filter((u: UsuarioOnline | null): u is UsuarioOnline => u !== null);
      
      setUsuarios(usuariosMapeados);
      
      // Buscar estatísticas avançadas
      if (mostrarAnalytics) {
        await fetchEstatisticas();
      }
    } catch (err: unknown) {
      safeLog.error('Erro ao buscar monitoramento:', err);
      setError(getSafeErrorMessage(err) || 'Erro desconhecido ao carregar monitoramento');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, [mostrarAnalytics, fetchEstatisticas]);

  useEffect(() => {
    fetchMonitoramento();
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchMonitoramento();
      }, 10000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, fetchMonitoramento]);

  const formatarTempo = (segundos: number) => {
    if (segundos < 60) return `${Math.floor(segundos)}s`;
    if (segundos < 3600) return `${Math.floor(segundos / 60)}m`;
    return `${Math.floor(segundos / 3600)}h ${Math.floor((segundos % 3600) / 60)}m`;
  };

  const getStatusColor = (segundos: number) => {
    if (segundos < 60) return 'bg-emerald-500';
    if (segundos < 180) return 'bg-amber-500';
    return 'bg-slate-400';
  };

  const formatarTimestamp = (timestamp: string | null | undefined) => {
    if (!timestamp) return 'Data desconhecida';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Data inválida';
      
      const agora = new Date();
      const diff = Math.floor((agora.getTime() - date.getTime()) / 1000);
      
      if (diff < 0) return 'Agora';
      if (diff < 60) return `${diff}s atrás`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
      return date.toLocaleDateString('pt-BR');
    } catch (err) {
      return 'Data inválida';
    }
  };

  // Calcular estatísticas (otimizado com useMemo)
  const usuariosAtivos = useMemo(() => usuarios.filter(u => u.segundos_inativo < 60).length, [usuarios]);
  const usuariosInativos = useMemo(() => usuarios.length - usuariosAtivos, [usuarios, usuariosAtivos]);
  const totalAcoes = useMemo(() => usuarios.reduce((sum, u) => sum + u.acoes_ultima_hora, 0), [usuarios]);
  
  // Filtrar usuários (otimizado com useMemo)
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      if (filtroStatus === 'ativos') {
        if (u.segundos_inativo >= 60) return false;
      } else if (filtroStatus === 'inativos') {
        if (u.segundos_inativo < 60) return false;
      }
      
      if (filtroUsuario && !u.nome?.toLowerCase().includes(filtroUsuario.toLowerCase()) && 
          !u.email?.toLowerCase().includes(filtroUsuario.toLowerCase())) {
        return false;
      }
      
      if (filtroAba && u.aba_atual !== filtroAba) {
        return false;
      }
      
      return true;
    });
  }, [usuarios, filtroStatus, filtroUsuario, filtroAba]);

  // Filtrar atividades
  const atividadesFiltradas = useMemo(() => {
    return atividades.filter(ativ => {
      if (filtroUsuario) {
        const usuario = usuarios.find(u => u.user_id === ativ.user_id);
        const nomeUsuario = usuario?.nome || usuario?.email || '';
        if (!nomeUsuario.toLowerCase().includes(filtroUsuario.toLowerCase())) {
          return false;
        }
      }
      
      if (filtroAba && ativ.tab_name !== filtroAba) {
        return false;
      }
      
      return true;
    });
  }, [atividades, usuarios, filtroUsuario, filtroAba]);

  // Obter lista de abas únicas para filtro
  const abasUnicas = useMemo(() => {
    const abas = new Set<string>();
    usuarios.forEach(u => {
      if (u.aba_atual) abas.add(u.aba_atual);
    });
    atividades.forEach(a => {
      if (a.tab_name) abas.add(a.tab_name);
    });
    return Array.from(abas).sort();
  }, [usuarios, atividades]);


  // Calcular altura máxima do gráfico de barras
  const maxAcoesHora = useMemo(() => {
    if (distribuicaoHora.length === 0) return 1;
    return Math.max(...distribuicaoHora.map(d => d.total_acoes));
  }, [distribuicaoHora]);

  if (loading && usuarios.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center animate-pulse-soft">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-lg font-semibold text-blue-700 dark:text-blue-200">Carregando monitoramento...</p>
        </div>
      </div>
    );
  }

  if (error && usuarios.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center animate-fade-in">
        <div className="max-w-sm mx-auto rounded-xl border border-rose-200 bg-white p-6 text-center shadow-xl dark:border-rose-900 dark:bg-slate-900">
          <div className="text-4xl">⚠️</div>
          <p className="mt-4 text-lg font-bold text-rose-900 dark:text-rose-100">Erro ao carregar monitoramento</p>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchMonitoramento();
            }}
            className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-rose-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map((alerta, idx) => (
            <div
              key={idx}
              className={`rounded-lg border p-4 ${
                alerta.severidade === 'error'
                  ? 'border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30'
                  : alerta.severidade === 'warning'
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
                  : 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">
                  {alerta.severidade === 'error' ? '🚨' : alerta.severidade === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">{alerta.tipo_alerta}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{alerta.mensagem}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Online"
          value={usuarios.length}
          icon="👥"
          color="blue"
        />

        <MetricCard
          title="Ativos"
          value={usuariosAtivos}
          icon="✅"
          color="green"
        />

        <MetricCard
          title="Inativos"
          value={usuariosInativos}
          icon="⏸️"
          color="red"
        />

        <MetricCard
          title="Ações (1h)"
          value={totalAcoes}
          icon="⚡"
          color="purple"
        />
      </div>

      {/* Controles */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroStatus('todos')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                filtroStatus === 'todos'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              Todos ({usuarios.length})
            </button>
            <button
              onClick={() => setFiltroStatus('ativos')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                filtroStatus === 'ativos'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              Ativos ({usuariosAtivos})
            </button>
            <button
              onClick={() => setFiltroStatus('inativos')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                filtroStatus === 'inativos'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              Inativos ({usuariosInativos})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filtro por usuário */}
            <input
              type="text"
              placeholder="Filtrar usuário..."
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            
            {/* Filtro por aba */}
            {abasUnicas.length > 0 && (
              <select
                value={filtroAba}
                onChange={(e) => setFiltroAba(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Todas as abas</option>
                {abasUnicas.map(aba => (
                  <option key={aba} value={aba}>{aba}</option>
                ))}
              </select>
            )}

            {/* Período de análise */}
            {mostrarAnalytics && (
              <select
                value={periodoAnalise}
                onChange={(e) => setPeriodoAnalise(e.target.value as '24h' | '7d' | '30d')}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="24h">Últimas 24h</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
              </select>
            )}

            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <span>Auto-atualizar (10s)</span>
            </label>
            
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={mostrarAnalytics}
                onChange={(e) => setMostrarAnalytics(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <span>Analytics</span>
            </label>
            
            <button
              onClick={() => {
                setLoading(true);
                fetchMonitoramento();
              }}
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-700 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? '⏳ Atualizando...' : '🔄 Atualizar'}
            </button>
          </div>
        </div>
      </div>

      {/* Usuários Online - PRIMEIRO EM DESTAQUE */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Lista de Usuários Online */}
        <div className="lg:col-span-2">
          {usuariosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {usuariosFiltrados.map((usuario) => (
                <div
                  key={usuario.user_id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-md transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${getStatusColor(usuario.segundos_inativo)} animate-pulse`}></div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{usuario.nome || usuario.email}</h3>
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{usuario.email}</p>
                      
                      <div className="mt-4 space-y-2">
                        {usuario.aba_atual && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Aba:</span>
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                              {usuario.aba_atual}
                            </span>
                          </div>
                        )}
                        
                        {usuario.pracas && usuario.pracas.length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Praças:</span>
                            <div className="flex flex-wrap gap-1">
                              {usuario.pracas.map((praca, idx) => (
                                <span key={idx} className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                  {praca}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Última ação:</span>
                          <span className="text-xs text-slate-700 dark:text-slate-300">{usuario.ultima_acao}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Inativo há:</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{formatarTempo(usuario.segundos_inativo)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ações (última hora):</span>
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                            {usuario.acoes_ultima_hora}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl text-white shadow-md">
                      👤
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900 dark:bg-amber-950/30">
              <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                Nenhum usuário {filtroStatus !== 'todos' ? filtroStatus : 'online'}
              </p>
              {(filtroUsuario || filtroAba) && (
                <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                  Tente ajustar os filtros
                </p>
              )}
            </div>
          )}
        </div>

        {/* Timeline de Atividades Recentes */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 p-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                <span>📜</span>
                Atividades Recentes
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Últimas {atividadesFiltradas.length} ações
              </p>
            </div>
            
            <div className="max-h-[600px] space-y-2 overflow-auto p-4">
              {atividadesFiltradas.length > 0 ? (
                atividadesFiltradas.slice(0, 50).map((ativ, idx) => {
                  if (!ativ || !ativ.user_id || !ativ.created_at) return null;
                  
                  const usuario = usuarios.find(u => u.user_id === ativ.user_id);
                  const nomeUsuario = usuario?.nome || usuario?.email || 'Usuário desconhecido';
                  
                  let actionDescription = '';
                  let actionIcon = '📝';
                  
                  if (ativ.action_details) {
                    actionDescription = ativ.action_details;
                  } else if (ativ.action_type) {
                    switch (ativ.action_type) {
                      case 'tab_change':
                        actionDescription = `Acessou a aba: ${ativ.tab_name || 'desconhecida'}`;
                        actionIcon = '🔄';
                        break;
                      case 'filter_change':
                        actionDescription = 'Alterou filtros';
                        actionIcon = '🔍';
                        break;
                      case 'login':
                        actionDescription = 'Fez login no sistema';
                        actionIcon = '🔐';
                        break;
                      case 'heartbeat':
                        actionDescription = `Ativo na aba ${ativ.tab_name || 'sistema'}`;
                        actionIcon = '💓';
                        break;
                      case 'page_visible':
                        actionDescription = `Voltou para a aba ${ativ.tab_name || 'sistema'}`;
                        actionIcon = '👁️';
                        break;
                      case 'page_hidden':
                        actionDescription = `Saiu da aba ${ativ.tab_name || 'sistema'}`;
                        actionIcon = '👋';
                        break;
                      default:
                        actionDescription = ativ.action_type || 'Ação desconhecida';
                    }
                  } else {
                    actionDescription = 'Ação desconhecida';
                  }
                  
                  return (
                    <div
                      key={ativ.id || `${ativ.user_id}-${ativ.created_at}-${idx}`}
                      className="group rounded-lg border border-slate-100 bg-slate-50 p-3 transition-all hover:border-indigo-200 hover:bg-indigo-50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30"
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 text-xs shrink-0">{actionIcon}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {nomeUsuario}
                          </p>
                          <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                            {actionDescription}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                            {formatarTimestamp(ativ.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }).filter(Boolean)
              ) : (
                <div className="py-8 text-center">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Nenhuma atividade registrada
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {filtroUsuario || filtroAba 
                      ? 'Tente ajustar os filtros'
                      : 'As atividades aparecerão aqui quando os usuários interagirem com o sistema'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas Avançadas e Analytics */}
      {mostrarAnalytics && (
        <>
          {/* Estatísticas Avançadas */}
          {estatisticas && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Ações"
                value={estatisticas.total_acoes || 0}
                icon="📊"
                color="blue"
                percentage={estatisticas.acoes_por_hora || 0}
                percentageLabel="por hora"
              />
              <MetricCard
                title="Usuários Únicos"
                value={estatisticas.usuarios_unicos || 0}
                icon="👤"
                color="green"
              />
              {estatisticas.aba_mais_usada && (
                <MetricCard
                  title="Aba Mais Usada"
                  value={estatisticas.aba_mais_usada}
                  icon="📈"
                  color="purple"
                />
              )}
              {estatisticas.periodo_mais_ativo && (
                <MetricCard
                  title="Período Mais Ativo"
                  value={estatisticas.periodo_mais_ativo}
                  icon="⏰"
                  color="red"
                />
              )}
            </div>
          )}

          {/* Gráficos e Analytics */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Gráfico de distribuição por hora */}
            {distribuicaoHora.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
                  📊 Atividades por Hora
                </h3>
                <div className="space-y-2">
                  {distribuicaoHora.map((item) => (
                    <div key={item.hora} className="flex items-center gap-3">
                      <div className="w-12 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {item.hora.toString().padStart(2, '0')}:00
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 rounded-full bg-slate-200 dark:bg-slate-700" style={{ height: '20px' }}>
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                              style={{ width: `${(item.total_acoes / maxAcoesHora) * 100}%` }}
                            ></div>
                          </div>
                          <span className="w-16 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {item.total_acoes}
                          </span>
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                          {item.usuarios_unicos} usuário(s)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Distribuição por aba */}
            {distribuicaoAba.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
                  📈 Distribuição por Aba
                </h3>
                <div className="space-y-3">
                  {distribuicaoAba.map((item) => (
                    <div key={item.tab_name}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {item.tab_name}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {item.percentual.toFixed(1)}%
                        </span>
                      </div>
                      <div className="rounded-full bg-slate-200 dark:bg-slate-700" style={{ height: '8px' }}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                          style={{ width: `${item.percentual}%` }}
                        ></div>
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {item.total_acoes} ações • {item.usuarios_unicos} usuário(s)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Usuários */}
          {topUsuarios.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
                🏆 Top Usuários Mais Ativos
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {topUsuarios.map((usuario, idx) => (
                  <div
                    key={usuario.user_id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-slate-400">#{idx + 1}</span>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {usuario.user_name || usuario.user_email}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          {usuario.user_email}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Ações:</span>
                        <span className="ml-1 font-bold text-slate-900 dark:text-white">
                          {usuario.total_acoes}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Abas:</span>
                        <span className="ml-1 font-bold text-slate-900 dark:text-white">
                          {usuario.abas_diferentes}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MonitoramentoView;
