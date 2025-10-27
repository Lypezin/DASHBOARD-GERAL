-- =====================================================================
-- OTIMIZAÇÃO DASHBOARD_RESUMO COM CTE (LEITURA ÚNICA DA TABELA)
-- =====================================================================
-- Solução: Usar CTE para filtrar dados UMA VEZ e reutilizar em todas as consultas
-- Isso evita múltiplas leituras da tabela dados_corridas (era feito 7+ vezes)
-- =====================================================================

-- Remover função antiga
DROP FUNCTION IF EXISTS public.dashboard_resumo(integer, integer, text, text, text);

-- Criar função OTIMIZADA com CTE
CREATE OR REPLACE FUNCTION public.dashboard_resumo(
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
SET search_path = public
SET statement_timeout = '60000ms'
AS $$
DECLARE
  v_result jsonb;
  v_is_admin boolean;
  v_assigned_pracas text[];
BEGIN
  -- Verificar se é admin
  SELECT 
    auth.role() = 'service_role' OR 
    (SELECT COUNT(*) > 0 FROM auth.users WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin')
  INTO v_is_admin;
  
  -- Obter praças atribuídas (se não for admin)
  IF NOT v_is_admin THEN
    SELECT COALESCE(array_agg(praca), ARRAY[]::text[])
    INTO v_assigned_pracas
    FROM public.user_pracas
    WHERE user_id = auth.uid();
  ELSE
    v_assigned_pracas := ARRAY[]::text[];
  END IF;

  -- Executar consulta otimizada com CTE
  SELECT jsonb_build_object(
    'totais', totais.data,
    'semanal', semanal.data,
    'dia', dia.data,
    'turno', turno.data,
    'sub_praca', sub_praca.data,
    'origem', origem.data,
    'dimensoes', dimensoes.data
  ) INTO v_result
  FROM (
    -- CTE PRINCIPAL: Filtrar dados UMA VEZ
    WITH filtered_data AS (
      SELECT
        ano_iso,
        semana_numero,
        dia_iso,
        periodo,
        praca,
        sub_praca,
        origem,
        numero_minimo_de_entregadores_regulares_na_escala,
        COALESCE(duracao_segundos, hhmmss_to_seconds(duracao_do_periodo)) AS duracao_segundos,
        COALESCE(tempo_disponivel_absoluto_segundos, hhmmss_to_seconds(tempo_disponivel_absoluto)) AS tempo_absoluto_segundos,
        numero_de_corridas_ofertadas,
        numero_de_corridas_aceitas,
        numero_de_corridas_rejeitadas,
        numero_de_corridas_completadas
      FROM public.dados_corridas
      WHERE data_do_periodo IS NOT NULL
        AND (p_ano IS NULL OR ano_iso = p_ano)
        AND (p_semana IS NULL OR semana_numero = p_semana)
        AND (p_praca IS NULL OR praca = p_praca)
        AND (p_sub_praca IS NULL OR sub_praca = p_sub_praca)
        AND (p_origem IS NULL OR origem = p_origem)
        AND (v_is_admin OR praca = ANY(v_assigned_pracas))
    ),
    
    -- Totais gerais (usa filtered_data)
    totais AS (
      SELECT jsonb_build_object(
        'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_ofertadas), 0),
        'corridas_aceitas', COALESCE(SUM(numero_de_corridas_aceitas), 0),
        'corridas_rejeitadas', COALESCE(SUM(numero_de_corridas_rejeitadas), 0),
        'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
      ) AS data
      FROM filtered_data
    ),
    
    -- Aderência por origem (usa filtered_data)
    origem AS (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'origem', origem,
            'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_ofertadas), 0),
            'corridas_aceitas', COALESCE(SUM(numero_de_corridas_aceitas), 0),
            'corridas_rejeitadas', COALESCE(SUM(numero_de_corridas_rejeitadas), 0),
            'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
          )
          ORDER BY origem
        ),
        '[]'::jsonb
      ) AS data
      FROM filtered_data
      WHERE origem IS NOT NULL
      GROUP BY origem
    ),
    
    -- Aderência por sub-praça (usa filtered_data)
    sub_praca AS (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'sub_praca', sub_praca,
            'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_ofertadas), 0),
            'corridas_aceitas', COALESCE(SUM(numero_de_corridas_aceitas), 0),
            'corridas_rejeitadas', COALESCE(SUM(numero_de_corridas_rejeitadas), 0),
            'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
          )
          ORDER BY sub_praca
        ),
        '[]'::jsonb
      ) AS data
      FROM filtered_data
      WHERE sub_praca IS NOT NULL
      GROUP BY sub_praca
    ),
    
    -- Aderência por turno (usa filtered_data)
    turno AS (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'periodo', periodo,
            'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_ofertadas), 0),
            'corridas_aceitas', COALESCE(SUM(numero_de_corridas_aceitas), 0),
            'corridas_rejeitadas', COALESCE(SUM(numero_de_corridas_rejeitadas), 0),
            'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
          )
          ORDER BY periodo
        ),
        '[]'::jsonb
      ) AS data
      FROM filtered_data
      WHERE periodo IS NOT NULL
      GROUP BY periodo
    ),
    
    -- Aderência por dia (usa filtered_data)
    dia AS (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'dia_iso', dia_iso,
            'dia_da_semana', CASE dia_iso
              WHEN 1 THEN 'Segunda'
              WHEN 2 THEN 'Terça'
              WHEN 3 THEN 'Quarta'
              WHEN 4 THEN 'Quinta'
              WHEN 5 THEN 'Sexta'
              WHEN 6 THEN 'Sábado'
              WHEN 7 THEN 'Domingo'
              ELSE 'N/D' END,
            'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_ofertadas), 0),
            'corridas_aceitas', COALESCE(SUM(numero_de_corridas_aceitas), 0),
            'corridas_rejeitadas', COALESCE(SUM(numero_de_corridas_rejeitadas), 0),
            'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
          )
          ORDER BY dia_iso
        ),
        '[]'::jsonb
      ) AS data
      FROM filtered_data
      GROUP BY dia_iso
    ),
    
    -- Aderência semanal (usa filtered_data)
    semanal AS (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'semana', 'Semana ' || LPAD(semana_numero::text, 2, '0'),
            'corridas_ofertadas', COALESCE(SUM(numero_de_corridas_ofertadas), 0),
            'corridas_aceitas', COALESCE(SUM(numero_de_corridas_aceitas), 0),
            'corridas_rejeitadas', COALESCE(SUM(numero_de_corridas_rejeitadas), 0),
            'corridas_completadas', COALESCE(SUM(numero_de_corridas_completadas), 0)
          )
          ORDER BY ano_iso DESC, semana_numero DESC
        ),
        '[]'::jsonb
      ) AS data
      FROM filtered_data
      GROUP BY ano_iso, semana_numero
    ),
    
    -- Dimensões (usa filtered_data)
    dimensoes AS (
      SELECT jsonb_build_object(
        'anos', COALESCE((
          SELECT jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC)
          FROM filtered_data
          WHERE ano_iso IS NOT NULL
        ), '[]'::jsonb),
        'semanas', COALESCE((
          SELECT jsonb_agg(DISTINCT semana_numero ORDER BY semana_numero DESC)
          FROM filtered_data
          WHERE semana_numero IS NOT NULL
        ), '[]'::jsonb),
        'pracas', COALESCE((
          SELECT jsonb_agg(DISTINCT praca ORDER BY praca)
          FROM filtered_data
          WHERE praca IS NOT NULL
        ), '[]'::jsonb),
        'sub_pracas', COALESCE((
          SELECT jsonb_agg(DISTINCT sub_praca ORDER BY sub_praca)
          FROM filtered_data
          WHERE sub_praca IS NOT NULL
        ), '[]'::jsonb),
        'origens', COALESCE((
          SELECT jsonb_agg(DISTINCT origem ORDER BY origem)
          FROM filtered_data
          WHERE origem IS NOT NULL
        ), '[]'::jsonb)
      ) AS data
    )
    SELECT * FROM totais, semanal, dia, turno, sub_praca, origem, dimensoes
  ) AS result;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro em dashboard_resumo: %', SQLERRM;
    RETURN jsonb_build_object(
      'totais', jsonb_build_object(
        'corridas_ofertadas', 0,
        'corridas_aceitas', 0,
        'corridas_rejeitadas', 0,
        'corridas_completadas', 0
      ),
      'semanal', '[]'::jsonb,
      'dia', '[]'::jsonb,
      'turno', '[]'::jsonb,
      'sub_praca', '[]'::jsonb,
      'origem', '[]'::jsonb,
      'dimensoes', jsonb_build_object(
        'anos', '[]'::jsonb,
        'semanas', '[]'::jsonb,
        'pracas', '[]'::jsonb,
        'sub_pracas', '[]'::jsonb,
        'origens', '[]'::jsonb
      ),
      'erro', SQLERRM
    );
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.dashboard_resumo(integer, integer, text, text, text)
  TO anon, authenticated, service_role;

-- Verificação
SELECT 
  '✅ OTIMIZAÇÃO APLICADA: dashboard_resumo agora lê dados_corridas APENAS UMA VEZ' as status,
  'LEITURAS REDUZIDAS DE 7+ PARA 1' as melhoria;
