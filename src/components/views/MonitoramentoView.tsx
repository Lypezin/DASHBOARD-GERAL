import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UsuarioOnline } from '@/types';
import MetricCard from '../MetricCard';
import { safeLog, getSafeErrorMessage } from '@/lib/errorHandler';
import { sanitizeText } from '@/lib/sanitize';

const IS_DEV = process.env.NODE_ENV === 'development';

function MonitoramentoView() {
  const [usuarios, setUsuarios] = useState<UsuarioOnline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');
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
  
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
        }
        
        // Se a função não existir, mostrar mensagem específica
        if (errorWithCode.code === '42883') {
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
      
      // Buscar atividades recentes (últimas 50) - com tratamento de erro não bloqueante
      let atividadesData: Atividade[] = [];
      try {
        const { data: atividadesResponse, error: atividadesError } = await supabase
          .from('user_activity')
          .select('id, user_id, action_type, action_details, tab_name, filters_applied, created_at, session_id')
          .order('created_at', { ascending: false })
          .limit(50);
      
        if (atividadesError) {
          safeLog.warn('Erro ao buscar atividades:', atividadesError);
          // Se a tabela não existir, código 42P01
          if (atividadesError.code === '42P01') {
            safeLog.warn('Tabela user_activity não existe. As atividades serão registradas quando a tabela for criada.');
          }
          setAtividades([]);
        } else if (atividadesResponse && Array.isArray(atividadesResponse)) {
          atividadesData = atividadesResponse as Atividade[];
          setAtividades(atividadesData);
          if (atividadesData.length > 0) {
            safeLog.info(`✅ ${atividadesData.length} atividades carregadas`);
          } else {
            safeLog.info('ℹ️ Nenhuma atividade encontrada na tabela user_activity');
          }
        } else {
          setAtividades([]);
          if (!atividadesError) {
            safeLog.warn('Resposta de atividades inválida:', atividadesResponse);
          }
        }
      } catch (err: unknown) {
        safeLog.warn('Erro ao buscar atividades (pode não estar disponível):', err);
        const error = err as { code?: string };
        if (error?.code === '42P01') {
          safeLog.warn('Tabela user_activity não existe no banco de dados.');
        }
        setAtividades([]);
        // Não bloquear a funcionalidade principal se atividades falhar
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
        // Validações de segurança
        if (!u || !u.user_id) return null;
        
        // Segundos de inatividade já vem como número do backend
        const segundosInativo = typeof u.seconds_inactive === 'number' ? u.seconds_inactive : 0;
        
        // Extrair praças dos filtros com validação
        const filtros: FiltersApplied = (u.filters_applied as FiltersApplied) || {};
        let pracas: string[] = [];
        if (filtros.p_praca) {
          pracas = Array.isArray(filtros.p_praca) ? filtros.p_praca : [filtros.p_praca];
        } else if (filtros.praca) {
          pracas = Array.isArray(filtros.praca) ? filtros.praca : [filtros.praca];
        }
        
        // A descrição detalhada já vem do backend (action_details)
        // Nota: action_type não existe em UsuarioOnlineRaw, apenas last_action_type
        const descricaoAcao = u.action_details || u.last_action_type || 'Atividade desconhecida';
        
        // Contar ações da última hora com validação
        const umaHoraAtras = new Date();
        umaHoraAtras.setHours(umaHoraAtras.getHours() - 1);
        const acoesUltimaHora = atividadesData.filter((a: Atividade) => 
          a && a.user_id === u.user_id && a.created_at && new Date(a.created_at) > umaHoraAtras
        ).length;
        
        // Sanitizar dados do usuário
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
      }).filter((u: UsuarioOnline | null): u is UsuarioOnline => u !== null); // Filtrar nulos
      
      setUsuarios(usuariosMapeados);
    } catch (err: unknown) {
      safeLog.error('Erro ao buscar monitoramento:', err);
      setError(getSafeErrorMessage(err) || 'Erro desconhecido ao carregar monitoramento');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitoramento();
    
    // Limpar intervalo anterior se existir
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchMonitoramento();
      }, 10000); // Atualizar a cada 10 segundos
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

  // IMPORTANTE: Todos os hooks devem ser chamados ANTES de qualquer early return
  // Calcular estatísticas (otimizado com useMemo)
  const usuariosAtivos = useMemo(() => usuarios.filter(u => u.segundos_inativo < 60).length, [usuarios]);
  const usuariosInativos = useMemo(() => usuarios.length - usuariosAtivos, [usuarios, usuariosAtivos]);
  const totalAcoes = useMemo(() => usuarios.reduce((sum, u) => sum + u.acoes_ultima_hora, 0), [usuarios]);
  
  // Filtrar usuários (otimizado com useMemo)
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      if (filtroStatus === 'ativos') return u.segundos_inativo < 60;
      if (filtroStatus === 'inativos') return u.segundos_inativo >= 60;
      return true;
    });
  }, [usuarios, filtroStatus]);

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

  // Mostrar erro se houver e não houver usuários
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

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <span>Auto-atualizar (10s)</span>
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

      {/* Conteúdo */}
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
                        {/* Aba Atual */}
                        {usuario.aba_atual && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Aba:</span>
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                              {usuario.aba_atual}
                            </span>
                          </div>
                        )}
                        
                        {/* Praças */}
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
                        
                        {/* Última Ação */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Última ação:</span>
                          <span className="text-xs text-slate-700 dark:text-slate-300">{usuario.ultima_acao}</span>
                        </div>
                        
                        {/* Tempo Inativo */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Inativo há:</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{formatarTempo(usuario.segundos_inativo)}</span>
                        </div>
                        
                        {/* Ações última hora */}
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
                Últimas {atividades.length} ações
              </p>
            </div>
            
            <div className="max-h-[600px] space-y-2 overflow-auto p-4">
              {atividades.length > 0 ? (
                atividades.map((ativ, idx) => {
                  // Validação de dados antes de renderizar
                  if (!ativ || !ativ.user_id || !ativ.created_at) return null;
                  
                  // Buscar nome do usuário da lista de usuários online
                  const usuario = usuarios.find(u => u.user_id === ativ.user_id);
                  const nomeUsuario = usuario?.nome || usuario?.email || 'Usuário desconhecido';
                  
                  // Determinar descrição da ação
                  let actionDescription = '';
                  let actionIcon = '📝';
                  
                  if (ativ.action_details) {
                    // Se tiver action_details, usar diretamente
                    actionDescription = ativ.action_details;
                  } else if (ativ.action_type) {
                    // Senão, construir baseado no tipo
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
                    As atividades aparecerão aqui quando os usuários interagirem com o sistema
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonitoramentoView;
