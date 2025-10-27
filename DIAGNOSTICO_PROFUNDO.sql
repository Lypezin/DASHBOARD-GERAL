-- =====================================================================
-- DIAGNÓSTICO PROFUNDO
-- =====================================================================
-- Vamos entender exatamente o que está acontecendo
-- =====================================================================

-- 1. Verificar dados da Semana 35 Guarulhos
SELECT 
  'Total de registros' as tipo,
  COUNT(*) as quantidade
FROM dados_corridas
WHERE semana_numero = 35 
  AND praca = 'GUARULHOS'
  AND ano_iso = 2025;

-- 2. Verificar distintos para cálculo correto (como Excel)
SELECT 
  'Periodos unicos (DISTINCT)' as tipo,
  COUNT(*) as quantidade
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
) distinct_periods;

-- 3. Calcular horas planejadas CORRETAS (método Excel)
SELECT 
  'Horas Planejadas (metodo Excel)' as tipo,
  ROUND(SUM(EXTRACT(EPOCH FROM duracao_do_periodo::INTERVAL) * numero_minimo_de_entregadores_regulares_na_escala) / 3600.0, 2) as horas
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
) distinct_periods;

-- 4. Calcular usando tempo_disponivel_escalado_segundos (método atual - ERRADO)
SELECT 
  'Horas Planejadas (tempo_disponivel_escalado)' as tipo,
  ROUND(SUM(tempo_disponivel_escalado_segundos) / 3600.0, 2) as horas
FROM dados_corridas
WHERE semana_numero = 35 
  AND praca = 'GUARULHOS'
  AND ano_iso = 2025;

-- 5. Calcular horas entregues
SELECT 
  'Horas Entregues' as tipo,
  ROUND(SUM(tempo_disponivel_absoluto_segundos) / 3600.0, 2) as horas
FROM dados_corridas
WHERE semana_numero = 35 
  AND praca = 'GUARULHOS'
  AND ano_iso = 2025;

-- 6. Verificar quantidade de dados para admin (TODAS as praças)
SELECT 
  'Total de registros ADMIN (todas pracas)' as tipo,
  COUNT(*) as quantidade,
  COUNT(DISTINCT praca) as pracas_distintas,
  COUNT(DISTINCT ano_iso || '-' || semana_numero) as semanas_distintas
FROM dados_corridas;

-- 7. Ver distribuição de dados por praça
SELECT 
  praca,
  COUNT(*) as total_registros,
  COUNT(DISTINCT semana_numero) as semanas
FROM dados_corridas
GROUP BY praca
ORDER BY total_registros DESC;

