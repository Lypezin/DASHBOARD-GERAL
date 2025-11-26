-- Script de teste para verificar dados disponíveis
-- Execute este script no SQL Editor do Supabase para diagnosticar o problema

-- 1. Verificar quais semanas têm dados na view base_corridas
SELECT 
  DISTINCT
  EXTRACT(ISOYEAR FROM data AT TIME ZONE 'America/Sao_Paulo') as ano,
  EXTRACT(WEEK FROM data AT TIME ZONE 'America/Sao_Paulo') as semana,
  COUNT(*) as total_corridas
FROM base_corridas
WHERE EXTRACT(WEEK FROM data AT TIME ZONE 'America/Sao_Paulo') IN (35, 36)
  AND EXTRACT(ISOYEAR FROM data AT TIME ZONE 'America/Sao_Paulo') = 2025
GROUP BY ano, semana
ORDER BY ano, semana;

-- 2. Testar a função dashboard_resumo diretamente
SELECT * FROM dashboard_resumo(
  p_ano := 2025,
  p_semana := 35,
  p_cidade := NULL,
  p_praca :=NULL,
  p_sub_praca := NULL,
  p_origem := NULL,
  p_turno := NULL,
  p_semanas := NULL,
  p_sub_pracas := NULL,
  p_origens := NULL,
  p_turnos := NULL,
  p_data_inicial := NULL,
  p_data_final := NULL
);

-- 3. Verificar contagem total por dia na semana 35
SELECT 
  EXTRACT(ISODOW FROM data AT TIME ZONE 'America/Sao_Paulo') as dia_iso,
  TO_CHAR(data AT TIME ZONE 'America/Sao_Paulo', 'Day') as dia_nome,
  COUNT(*) as total
FROM base_corridas
WHERE EXTRACT(WEEK FROM data AT TIME ZONE 'America/Sao_Paulo') = 35
  AND EXTRACT(ISOYEAR FROM data AT TIME ZONE 'America/Sao_Paulo') = 2025
GROUP BY dia_iso, dia_nome
ORDER BY dia_iso;
