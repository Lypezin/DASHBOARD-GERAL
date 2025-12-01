-- Teste para confirmar se o problema é a agregação por dia da semana
-- Execute no SQL Editor

-- 1. Ver dados brutos para GUARULHOS semana 38
SELECT 
    data_do_periodo::date,
    EXTRACT(ISODOW FROM data_do_periodo) as dia_iso,
    COUNT(*) as registros,
    SUM(total_ofertadas) as total_ofertadas
FROM tb_dashboard_resumo
WHERE praca = 'GUARULHOS'
  AND semana_iso = 38
  AND ano_iso = 2025
GROUP BY 1, 2
ORDER BY 1;

-- 2. Chamar a função exatamente como o frontend faz
SELECT 
    total_ofertadas,
    total_aceitas,
    jsonb_array_length(aderencia_dia) as dias_count,
    aderencia_dia
FROM dashboard_resumo(
  p_ano := 2025,
  p_semana := 38,
  p_praca := 'GUARULHOS',
  p_sub_praca := NULL,
  p_origem := NULL,
  p_turno := NULL,
  p_semanas := NULL,
  p_sub_pracas := NULL,
  p_origens := NULL,
  p_turnos := NULL,
  p_filtro_modo := 'ano_semana',
  p_data_inicial := NULL,
  p_data_final := NULL,
  p_organization_id := NULL
);
