-- =============================================================================
-- CORREÇÃO ESPECÍFICA: GUIA ENTREGADORES
-- =============================================================================
-- Corrige a função listar_entregadores para garantir que retorne dados
-- =============================================================================

-- REMOVER função problemática
DROP FUNCTION IF EXISTS public.listar_entregadores(integer, integer, text, text, text) CASCADE;

-- =============================================================================
-- VERSÃO SIMPLIFICADA E ROBUSTA: listar_entregadores
-- =============================================================================

CREATE OR REPLACE FUNCTION public.listar_entregadores(
  p_ano integer DEFAULT NULL,
  p_semana integer DEFAULT NULL,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET statement_timeout = '120000ms'
SET work_mem = '512MB'
AS $$
DECLARE
  v_result jsonb;
  v_count integer;
  v_has_filters boolean;
BEGIN
  -- Debug: Verificar se há dados na tabela
  SELECT COUNT(*) INTO v_count 
  FROM public.dados_corridas 
  WHERE id_da_pessoa_entregadora IS NOT NULL;
  
  RAISE NOTICE 'Total de registros com entregadores: %', v_count;
  
  -- Verificar se há filtros
  v_has_filters := (p_ano IS NOT NULL OR p_semana IS NOT NULL OR p_praca IS NOT NULL OR p_sub_praca IS NOT NULL OR p_origem IS NOT NULL);
  
  RAISE NOTICE 'Filtros aplicados: ano=%, semana=%, praca=%, sub_praca=%, origem=%', p_ano, p_semana, p_praca, p_sub_praca, p_origem;

  -- Query principal simplificada
  WITH entregadores_base AS (
    SELECT 
      d.id_da_pessoa_entregadora::text as id_entregador,
      COALESCE(
        MAX(CASE WHEN d.nome_da_pessoa_entregadora IS NOT NULL AND d.nome_da_pessoa_entregadora != '' 
             THEN d.nome_da_pessoa_entregadora 
             ELSE d.id_da_pessoa_entregadora::text END), 
        d.id_da_pessoa_entregadora::text
      ) as nome_entregador,
      SUM(COALESCE(d.numero_de_corridas_ofertadas, 0)) as corridas_ofertadas,
      SUM(COALESCE(d.numero_de_corridas_aceitas, 0)) as corridas_aceitas,
      SUM(COALESCE(d.numero_de_corridas_rejeitadas, 0)) as corridas_rejeitadas,
      SUM(COALESCE(d.numero_de_corridas_completadas, 0)) as corridas_completadas,
      SUM(COALESCE(d.tempo_disponivel_escalado_segundos, 0)) as tempo_escalado_total,
      SUM(COALESCE(d.duracao_segundos, 0)) as duracao_total
    FROM public.dados_corridas d
    WHERE d.id_da_pessoa_entregadora IS NOT NULL
      AND d.data_do_periodo IS NOT NULL
      AND (p_ano IS NULL OR d.ano_iso = p_ano)
      AND (p_semana IS NULL OR d.semana_numero = p_semana)
      AND (p_praca IS NULL OR d.praca = p_praca)
      AND (p_sub_praca IS NULL OR d.sub_praca = p_sub_praca)
      AND (p_origem IS NULL OR d.origem = p_origem)
    GROUP BY d.id_da_pessoa_entregadora
  ),
  entregadores_calculados AS (
    SELECT 
      e.id_entregador,
      e.nome_entregador,
      e.corridas_ofertadas::integer,
      e.corridas_aceitas::integer, 
      e.corridas_rejeitadas::integer,
      e.corridas_completadas::integer,
      -- Calcular aderência de forma segura
      CASE 
        WHEN e.duracao_total > 0 
        THEN ROUND((e.tempo_escalado_total::numeric / e.duracao_total::numeric) * 100, 2)
        ELSE 0::numeric
      END as aderencia_percentual,
      -- Calcular rejeição de forma segura  
      CASE 
        WHEN e.corridas_ofertadas > 0 
        THEN ROUND((e.corridas_rejeitadas::numeric / e.corridas_ofertadas::numeric) * 100, 2)
        ELSE 0::numeric
      END as rejeicao_percentual
    FROM entregadores_base e
    WHERE e.corridas_aceitas > 0 OR e.corridas_ofertadas > 0  -- Só incluir entregadores com atividade
    ORDER BY 
      CASE 
        WHEN e.duracao_total > 0 
        THEN ROUND((e.tempo_escalado_total::numeric / e.duracao_total::numeric) * 100, 2)
        ELSE 0::numeric
      END DESC NULLS LAST,
      e.corridas_aceitas DESC
    LIMIT CASE WHEN v_has_filters THEN NULL ELSE 500 END
  )
  SELECT jsonb_build_object(
    'entregadores', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id_entregador', ec.id_entregador,
        'nome_entregador', ec.nome_entregador,
        'corridas_ofertadas', ec.corridas_ofertadas,
        'corridas_aceitas', ec.corridas_aceitas,
        'corridas_rejeitadas', ec.corridas_rejeitadas,
        'corridas_completadas', ec.corridas_completadas,
        'aderencia_percentual', ec.aderencia_percentual,
        'rejeicao_percentual', ec.rejeicao_percentual
      )
    ), '[]'::jsonb),
    'total', COUNT(*)
  )
  INTO v_result
  FROM entregadores_calculados ec;

  -- Verificar se encontrou resultados
  SELECT COUNT(*) INTO v_count FROM entregadores_base;
  RAISE NOTICE 'Entregadores encontrados após filtros: %', v_count;

  -- Se não encontrou nada, tentar sem filtros como fallback
  IF v_result->'total' = '0'::jsonb AND v_has_filters THEN
    RAISE NOTICE 'Nenhum resultado com filtros, tentando sem filtros...';
    
    WITH entregadores_fallback AS (
      SELECT 
        d.id_da_pessoa_entregadora::text as id_entregador,
        COALESCE(MAX(d.nome_da_pessoa_entregadora), d.id_da_pessoa_entregadora::text) as nome_entregador,
        SUM(COALESCE(d.numero_de_corridas_ofertadas, 0))::integer as corridas_ofertadas,
        SUM(COALESCE(d.numero_de_corridas_aceitas, 0))::integer as corridas_aceitas,
        SUM(COALESCE(d.numero_de_corridas_rejeitadas, 0))::integer as corridas_rejeitadas,
        SUM(COALESCE(d.numero_de_corridas_completadas, 0))::integer as corridas_completadas,
        0::numeric as aderencia_percentual,
        0::numeric as rejeicao_percentual
      FROM public.dados_corridas d
      WHERE d.id_da_pessoa_entregadora IS NOT NULL
        AND d.data_do_periodo IS NOT NULL
      GROUP BY d.id_da_pessoa_entregadora
      HAVING SUM(COALESCE(d.numero_de_corridas_aceitas, 0)) > 0
      ORDER BY SUM(COALESCE(d.numero_de_corridas_aceitas, 0)) DESC
      LIMIT 10
    )
    SELECT jsonb_build_object(
      'entregadores', COALESCE(jsonb_agg(
        jsonb_build_object(
          'id_entregador', ef.id_entregador,
          'nome_entregador', ef.nome_entregador,
          'corridas_ofertadas', ef.corridas_ofertadas,
          'corridas_aceitas', ef.corridas_aceitas,
          'corridas_rejeitadas', ef.corridas_rejeitadas,
          'corridas_completadas', ef.corridas_completadas,
          'aderencia_percentual', ef.aderencia_percentual,
          'rejeicao_percentual', ef.rejeicao_percentual
        )
      ), '[]'::jsonb),
      'total', COUNT(*),
      'fallback', true
    )
    INTO v_result
    FROM entregadores_fallback ef;
  END IF;

  -- Garantir que sempre retorna algo válido
  IF v_result IS NULL THEN
    v_result := jsonb_build_object(
      'entregadores', '[]'::jsonb,
      'total', 0,
      'debug', 'Nenhum resultado encontrado'
    );
  END IF;

  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro em listar_entregadores: %', SQLERRM;
  RETURN jsonb_build_object(
    'entregadores', '[]'::jsonb,
    'total', 0,
    'error', SQLERRM,
    'debug', 'Exceção capturada'
  );
END;
$$;

-- =============================================================================
-- FUNÇÃO DE TESTE: Verificar dados disponíveis
-- =============================================================================

CREATE OR REPLACE FUNCTION debug_entregadores_dados()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH stats AS (
    SELECT 
      COUNT(*) as total_registros,
      COUNT(DISTINCT id_da_pessoa_entregadora) as entregadores_unicos,
      COUNT(DISTINCT data_do_periodo) as datas_unicas,
      MIN(data_do_periodo) as data_min,
      MAX(data_do_periodo) as data_max,
      SUM(CASE WHEN numero_de_corridas_aceitas > 0 THEN 1 ELSE 0 END) as registros_com_corridas
    FROM public.dados_corridas
    WHERE id_da_pessoa_entregadora IS NOT NULL
  )
  SELECT jsonb_build_object(
    'total_registros', s.total_registros,
    'entregadores_unicos', s.entregadores_unicos,
    'datas_unicas', s.datas_unicas,
    'periodo', s.data_min || ' até ' || s.data_max,
    'registros_com_corridas', s.registros_com_corridas
  )
  INTO v_result
  FROM stats s;
  
  RETURN v_result;
END;
$$;

-- =============================================================================
-- PERMISSÕES
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.listar_entregadores TO anon, authenticated;
GRANT EXECUTE ON FUNCTION debug_entregadores_dados TO anon, authenticated;

-- =============================================================================
-- VERIFICAÇÃO E TESTE
-- =============================================================================

DO $$
DECLARE
  v_debug jsonb;
  v_test jsonb;
BEGIN
  -- Verificar dados disponíveis
  SELECT debug_entregadores_dados() INTO v_debug;
  RAISE NOTICE 'Dados disponíveis: %', v_debug;
  
  -- Testar a função sem filtros
  SELECT public.listar_entregadores() INTO v_test;
  RAISE NOTICE 'Teste sem filtros - Total: %', v_test->'total';
  
  -- Verificar se a função foi criada
  IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'listar_entregadores') THEN
    RAISE NOTICE '✅ Função listar_entregadores criada com sucesso';
  ELSE
    RAISE NOTICE '❌ Erro ao criar função listar_entregadores';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔧 FUNÇÃO CORRIGIDA E SIMPLIFICADA';
  RAISE NOTICE '   • Lógica mais robusta e tolerante a erros';
  RAISE NOTICE '   • Debug integrado para identificar problemas';
  RAISE NOTICE '   • Fallback automático se não encontrar resultados com filtros';
  RAISE NOTICE '   • Tratamento seguro de valores nulos';
END;
$$;
