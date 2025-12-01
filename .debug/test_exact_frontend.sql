-- Teste para verificar se a função foi atualizada corretamente
-- Execute no SQL Editor

-- Este teste simula EXATAMENTE o que o frontend está fazendo
SELECT 
    'Frontend simulation' as teste,
    total_ofertadas,
    total_aceitas,
    jsonb_array_length(aderencia_dia) as dias_count,
    aderencia_dia
FROM dashboard_resumo(
  p_ano => 2025,
  p_semana => 38,
  p_semanas => NULL,
  p_praca => 'GUARULHOS',
  p_sub_praca => NULL,
  p_origem => NULL,
  p_turno => NULL,
  p_sub_pracas => NULL,
  p_origens => NULL,
  p_turnos => NULL,
  p_filtro_modo => 'ano_semana',
  p_data_inicial => NULL,
  p_data_final => NULL,
  p_organization_id => NULL
);
