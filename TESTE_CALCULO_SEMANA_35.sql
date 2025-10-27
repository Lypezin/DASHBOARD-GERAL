-- =====================================================================
-- TESTE: Verificar cálculo da Semana 35 Guarulhos
-- =====================================================================
-- Para comparar com o Excel
-- =====================================================================

-- Teste 1: Ver dados únicos (depois de remover duplicadas)
SELECT 
  data_do_periodo,
  periodo,
  duracao_do_periodo,
  numero_minimo_de_entregadores_regulares_na_escala,
  EXTRACT(EPOCH FROM duracao_do_periodo::INTERVAL) AS duracao_segundos,
  EXTRACT(EPOCH FROM duracao_do_periodo::INTERVAL) * numero_minimo_de_entregadores_regulares_na_escala AS horas_planejadas_segundos
FROM (
  SELECT DISTINCT
    data_do_periodo,
    periodo,
    duracao_do_periodo,
    numero_minimo_de_entregadores_regulares_na_escala
  FROM dados_corridas
  WHERE semana_numero = 35
    AND praca = 'GUARULHOS'
    AND ano_iso = 2025
) periodos_unicos
ORDER BY data_do_periodo, periodo
LIMIT 50;

-- Teste 2: Calcular total de horas planejadas
SELECT 
  COUNT(*) as total_periodos_unicos,
  ROUND(SUM(EXTRACT(EPOCH FROM duracao_do_periodo::INTERVAL) * numero_minimo_de_entregadores_regulares_na_escala) / 3600.0, 2) as horas_planejadas_total
FROM (
  SELECT DISTINCT
    data_do_periodo,
    periodo,
    duracao_do_periodo,
    numero_minimo_de_entregadores_regulares_na_escala
  FROM dados_corridas
  WHERE semana_numero = 35
    AND praca = 'GUARULHOS'
    AND ano_iso = 2025
) periodos_unicos;

-- Teste 3: Calcular horas entregues
SELECT 
  ROUND(SUM(COALESCE(tempo_disponivel_absoluto_segundos, 0)) / 3600.0, 2) as horas_entregues_total
FROM dados_corridas
WHERE semana_numero = 35
  AND praca = 'GUARULHOS'
  AND ano_iso = 2025;

-- Teste 4: Ver se há registros duplicados
SELECT 
  data_do_periodo,
  periodo,
  COUNT(*) as quantidade_registros
FROM dados_corridas
WHERE semana_numero = 35
  AND praca = 'GUARULHOS'
  AND ano_iso = 2025
GROUP BY data_do_periodo, periodo
HAVING COUNT(*) > 1
ORDER BY quantidade_registros DESC
LIMIT 10;

