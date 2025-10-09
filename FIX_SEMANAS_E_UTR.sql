-- =====================================================================
-- 🔧 CORREÇÃO: Semanas na comparação e verificação UTR
-- =====================================================================

-- PROBLEMA 1: Comparação mostrando semanas 1-40 (mas dados começam na 22)
-- SOLUÇÃO: Corrigir listar_todas_semanas para retornar apenas semanas com dados

DROP FUNCTION IF EXISTS public.listar_todas_semanas() CASCADE;

CREATE OR REPLACE FUNCTION public.listar_todas_semanas()
RETURNS integer[]
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT ARRAY_AGG(DISTINCT semana_numero ORDER BY semana_numero)
  FROM public.dados_corridas
  WHERE semana_numero IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.listar_todas_semanas() TO anon, authenticated;

-- PROBLEMA 2: UTR só mostrando geral
-- VERIFICAÇÃO: Testar se o backend está retornando os dados corretamente

SELECT '1️⃣ TESTANDO calcular_utr para GUARULHOS S35' as info;
SELECT public.calcular_utr(NULL, 35, 'GUARULHOS', NULL, NULL) as resultado_utr;

-- Ver estrutura do JSON retornado
SELECT '2️⃣ ESTRUTURA DO JSON RETORNADO' as info;
SELECT 
  jsonb_typeof(public.calcular_utr(NULL, 35, 'GUARULHOS', NULL, NULL)) as tipo_raiz,
  jsonb_object_keys(public.calcular_utr(NULL, 35, 'GUARULHOS', NULL, NULL)) as chaves_json;

-- Ver se sub_praca está presente e tem dados
SELECT '3️⃣ VERIFICANDO sub_praca NO RESULTADO' as info;
SELECT 
  (public.calcular_utr(NULL, 35, 'GUARULHOS', NULL, NULL)->'sub_praca') as dados_sub_praca,
  jsonb_array_length((public.calcular_utr(NULL, 35, 'GUARULHOS', NULL, NULL)->'sub_praca')) as quantidade_sub_pracas;

-- Ver se origem está presente e tem dados
SELECT '4️⃣ VERIFICANDO origem NO RESULTADO' as info;
SELECT 
  jsonb_array_length((public.calcular_utr(NULL, 35, 'GUARULHOS', NULL, NULL)->'origem')) as quantidade_origens;

-- Ver se turno está presente e tem dados
SELECT '5️⃣ VERIFICANDO turno NO RESULTADO' as info;
SELECT 
  jsonb_array_length((public.calcular_utr(NULL, 35, 'GUARULHOS', NULL, NULL)->'turno')) as quantidade_turnos;

SELECT '✅ TESTES CONCLUÍDOS' as status;
SELECT 'Se as quantidades são > 0, o problema está no frontend (mapeamento)' as diagnostico;
SELECT 'Se as quantidades são 0, o problema está no backend (query)' as diagnostico;

