-- =====================================================================
-- 🔧 CRIAR FUNÇÃO listar_todas_semanas (se não existir)
-- =====================================================================

-- Dropar se existir
DROP FUNCTION IF EXISTS public.listar_todas_semanas() CASCADE;

-- Criar função
CREATE OR REPLACE FUNCTION public.listar_todas_semanas()
RETURNS SETOF integer
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT DISTINCT semana_numero
  FROM public.mv_aderencia_agregada
  ORDER BY semana_numero;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.listar_todas_semanas() TO anon, authenticated;

-- Teste
SELECT '✅ Testando listar_todas_semanas' as info;
SELECT * FROM public.listar_todas_semanas();

