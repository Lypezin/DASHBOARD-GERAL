-- Teste SIMPLES para verificar se a função retorna dados
-- Execute no SQL Editor

-- Teste 1: SEM filtro de praça (deve retornar dados)
SELECT 
    'Sem filtro de praça' as teste,
    total_ofertadas,
    jsonb_array_length(aderencia_dia) as dias_count
FROM dashboard_resumo(
  p_ano := 2025,
  p_semana := 38,
  p_organization_id := NULL
);

-- Teste 2: COM filtro de praça GUARULHOS
SELECT 
    'Com GUARULHOS' as teste,
    total_ofertadas,
    jsonb_array_length(aderencia_dia) as dias_count
FROM dashboard_resumo(
  p_ano := 2025,
  p_semana := 38,
  p_praca := 'GUARULHOS',
  p_organization_id := NULL
);

-- Teste 3: Verificar se dados existem na tabela base
SELECT COUNT(*) as total_registros
FROM tb_dashboard_resumo
WHERE ano_iso = 2025
  AND semana_iso = 38;
