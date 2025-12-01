-- Teste para verificar se a FINAL_SOLUTION foi aplicada
-- Execute no SQL Editor

-- Simular chamada com UUID (como o frontend está fazendo)
SELECT 
    'Com UUID do admin' as teste,
    total_ofertadas,
    jsonb_array_length(aderencia_dia) as dias_count
FROM dashboard_resumo(
  p_ano => 2025,
  p_semana => 21,
  p_praca => 'SANTO ANDRÉ',
  p_organization_id => '00000000-0000-0000-0000-000000000001'
);

-- Verificar se há dados para essa semana e praça
SELECT COUNT(*) as total_na_tabela
FROM tb_dashboard_resumo
WHERE ano_iso = 2025
  AND semana_iso = 21
  AND praca = 'SANTO ANDRÉ';
