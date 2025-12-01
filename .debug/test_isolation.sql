-- Teste SEM filtro de praça para isolar o problema

-- Teste 1: NULL organization_id SEM filtro de praça
SELECT 
    'NULL org, SEM praça' as teste,
    total_ofertadas,
    jsonb_array_length(aderencia_dia) as dias_count
FROM dashboard_resumo(
  p_ano => 2025,
  p_semana => 38,
  p_organization_id => NULL
);

-- Teste 2: NULL organization_id COM filtro de praça
SELECT 
    'NULL org, COM praça' as teste,
    total_ofertadas,
    jsonb_array_length(aderencia_dia) as dias_count
FROM dashboard_resumo(
  p_ano => 2025,
  p_semana => 38,
  p_praca => 'GUARULHOS',
  p_organization_id => NULL
);

-- Teste 3: UUID explícito SEM filtro de praça
SELECT 
    'UUID org, SEM praça' as teste,
    total_ofertadas,
    jsonb_array_length(aderencia_dia) as dias_count
FROM dashboard_resumo(
  p_ano => 2025,
  p_semana => 38,
  p_organization_id => '00000000-0000-0000-0000-000000000001'
);

-- Teste 4: UUID explícito COM filtro de praça  
SELECT 
    'UUID org, COM praça' as teste,
    total_ofertadas,
    jsonb_array_length(aderencia_dia) as dias_count
FROM dashboard_resumo(
  p_ano => 2025,
  p_semana => 38,
  p_praca => 'GUARULHOS',
  p_organization_id => '00000000-0000-0000-0000-000000000001'
);
