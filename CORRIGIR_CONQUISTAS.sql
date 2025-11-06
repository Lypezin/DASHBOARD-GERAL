-- =====================================================
-- CORREÇÕES NO SISTEMA DE CONQUISTAS
-- Execute este SQL no Supabase para corrigir as conquistas
-- =====================================================

-- Corrigir função verificar_conquistas para usar action_type correto
CREATE OR REPLACE FUNCTION public.verificar_conquistas()
RETURNS TABLE (
  conquista_nova BOOLEAN,
  conquista_codigo VARCHAR,
  conquista_nome VARCHAR,
  conquista_icone VARCHAR,
  conquista_pontos INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_total_acessos INTEGER;
  v_total_tabs_visitadas INTEGER;
  v_total_filtros INTEGER;
  v_total_buscas INTEGER;
  v_total_comparacoes INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Contar estatísticas do usuário (corrigido para tab_change)
  SELECT COUNT(*) INTO v_total_acessos
  FROM public.user_activity
  WHERE user_id = v_user_id AND action_type IN ('page_load', 'tab_change');
  
  SELECT COUNT(DISTINCT tab_name) INTO v_total_tabs_visitadas
  FROM public.user_activity
  WHERE user_id = v_user_id AND tab_name IS NOT NULL AND tab_name != '';
  
  SELECT COUNT(*) INTO v_total_filtros
  FROM public.user_activity
  WHERE user_id = v_user_id AND (action_type = 'filter_change' OR action_details LIKE '%filtro%');
  
  SELECT COUNT(*) INTO v_total_buscas
  FROM public.user_activity
  WHERE user_id = v_user_id AND (action_type = 'search' OR action_details LIKE '%busca%');
  
  SELECT COUNT(*) INTO v_total_comparacoes
  FROM public.user_activity
  WHERE user_id = v_user_id AND tab_name = 'comparacao';
  
  -- Verificar conquista: Primeiro Acesso
  IF v_total_acessos >= 1 THEN
    INSERT INTO public.user_conquistas (user_id, conquista_id, progresso)
    SELECT v_user_id, id, 100
    FROM public.conquistas
    WHERE codigo = 'primeiro_acesso'
    ON CONFLICT (user_id, conquista_id) DO NOTHING;
  END IF;
  
  -- Verificar conquista: Explorador (8 ou mais tabs diferentes)
  IF v_total_tabs_visitadas >= 8 THEN
    INSERT INTO public.user_conquistas (user_id, conquista_id, progresso)
    SELECT v_user_id, id, 100
    FROM public.conquistas
    WHERE codigo = 'explorador'
    ON CONFLICT (user_id, conquista_id) DO NOTHING;
  END IF;
  
  -- Verificar conquista: Analista Iniciante
  IF v_total_filtros >= 10 THEN
    INSERT INTO public.user_conquistas (user_id, conquista_id, progresso)
    SELECT v_user_id, id, 100
    FROM public.conquistas
    WHERE codigo = 'analista_iniciante'
    ON CONFLICT (user_id, conquista_id) DO NOTHING;
  END IF;
  
  -- Verificar conquista: Analista Expert
  IF v_total_filtros >= 100 THEN
    INSERT INTO public.user_conquistas (user_id, conquista_id, progresso)
    SELECT v_user_id, id, 100
    FROM public.conquistas
    WHERE codigo = 'analista_expert'
    ON CONFLICT (user_id, conquista_id) DO NOTHING;
  END IF;
  
  -- Verificar conquista: Detetive de Dados
  IF v_total_buscas >= 50 THEN
    INSERT INTO public.user_conquistas (user_id, conquista_id, progresso)
    SELECT v_user_id, id, 100
    FROM public.conquistas
    WHERE codigo = 'detetive_dados'
    ON CONFLICT (user_id, conquista_id) DO NOTHING;
  END IF;
  
  -- Verificar conquista: Comparador
  IF v_total_comparacoes >= 5 THEN
    INSERT INTO public.user_conquistas (user_id, conquista_id, progresso)
    SELECT v_user_id, id, 100
    FROM public.conquistas
    WHERE codigo = 'comparador'
    ON CONFLICT (user_id, conquista_id) DO NOTHING;
  END IF;
  
  -- Retornar conquistas não visualizadas
  RETURN QUERY
  SELECT 
    true AS conquista_nova,
    c.codigo AS conquista_codigo,
    c.nome AS conquista_nome,
    c.icone AS conquista_icone,
    c.pontos AS conquista_pontos
  FROM public.user_conquistas uc
  JOIN public.conquistas c ON c.id = uc.conquista_id
  WHERE uc.user_id = v_user_id 
    AND NOT uc.visualizada
  ORDER BY uc.conquistada_em DESC;
END;
$$;

-- Testar a função
SELECT * FROM verificar_conquistas();

-- Ver estatísticas atuais do usuário
SELECT 
  'Acessos/Tab Changes' as metrica,
  COUNT(*) as total
FROM public.user_activity
WHERE user_id = auth.uid() AND action_type IN ('page_load', 'tab_change')
UNION ALL
SELECT 
  'Tabs Visitadas' as metrica,
  COUNT(DISTINCT tab_name) as total
FROM public.user_activity
WHERE user_id = auth.uid() AND tab_name IS NOT NULL
UNION ALL
SELECT 
  'Filtros' as metrica,
  COUNT(*) as total
FROM public.user_activity
WHERE user_id = auth.uid() AND action_type = 'filter_change';

