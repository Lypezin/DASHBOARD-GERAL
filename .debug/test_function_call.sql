-- Script para testar a chamada da função dashboard_resumo
-- Execute no SQL Editor

-- 1. Teste com organization_id NULO (deve retornar dados se for admin)
SELECT 
    'Teste com ORG NULL' as teste,
    total_ofertadas, 
    jsonb_array_length(aderencia_dia) as dias_count
FROM dashboard_resumo(
  p_ano := 2025,
  p_semana := 36,
  p_organization_id := NULL
);

-- 2. Teste com o ID da organização que sabemos que tem dados
SELECT 
    'Teste com ORG CORRETA' as teste,
    total_ofertadas, 
    jsonb_array_length(aderencia_dia) as dias_count
FROM dashboard_resumo(
  p_ano := 2025,
  p_semana := 36,
  p_organization_id := '00000000-0000-0000-0000-000000000001'
);

-- 3. Teste com um ID aleatório (simulando filtro errado)
SELECT 
    'Teste com ORG ERRADA' as teste,
    total_ofertadas, 
    jsonb_array_length(aderencia_dia) as dias_count
FROM dashboard_resumo(
  p_ano := 2025,
  p_semana := 36,
  p_organization_id := '00000000-0000-0000-0000-000000000002'
);
