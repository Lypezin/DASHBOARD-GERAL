-- =====================================================================
-- CORREÇÃO: listar_anos_disponiveis
-- =====================================================================
-- PROBLEMA: A função estava usando a tabela evolucao_agregada que foi removida
-- SOLUÇÃO: Atualizar para usar dados_corridas diretamente
-- =====================================================================

CREATE OR REPLACE FUNCTION public.listar_anos_disponiveis()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(DISTINCT ano_iso ORDER BY ano_iso DESC),
    '[]'::JSONB
  )
  FROM dados_corridas
  WHERE ano_iso IS NOT NULL;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.listar_anos_disponiveis() TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_anos_disponiveis() TO anon;

COMMENT ON FUNCTION public.listar_anos_disponiveis() IS 'Lista todos os anos disponíveis na tabela dados_corridas (corrigido após remoção de evolucao_agregada)';

-- =====================================================================
-- FIM DO SCRIPT
-- =====================================================================

