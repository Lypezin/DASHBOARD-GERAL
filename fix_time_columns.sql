-- Script definitivo para corrigir colunas de tempo no banco de dados
-- Execute este script no SQL Editor do Supabase

-- 1) Criar função robusta para converter qualquer formato de tempo para HH:MM:SS
CREATE OR REPLACE FUNCTION public.normalize_time_to_hhmmss(input_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result text := '00:00:00';
  time_part text;
  hours int;
  minutes int;
  seconds int;
BEGIN
  -- Trata valores nulos ou vazios
  IF input_value IS NULL OR trim(input_value) = '' THEN
    RETURN result;
  END IF;

  -- Converte para string para facilitar o processamento
  input_value := trim(input_value);

  -- CASO 1: String ISO com data e hora "1899-12-30T05:59:36.000Z"
  IF input_value LIKE '1899-12-30T%:%:%Z' THEN
    -- Extrai apenas a parte do tempo após 'T'
    time_part := split_part(input_value, 'T', 2);
    -- Remove milissegundos se existirem
    time_part := split_part(time_part, '.', 1);
    -- Formata com zeros à esquerda
    hours := lpad(split_part(time_part, ':', 1), 2, '0');
    minutes := lpad(split_part(time_part, ':', 2), 2, '0');
    seconds := lpad(split_part(time_part, ':', 3), 2, '0');
    result := hours || ':' || minutes || ':' || seconds;

  -- CASO 2: Apenas tempo "HH:MM:SS" ou "H:MM:SS"
  ELSIF input_value ~ '^[0-9]{1,2}:[0-9]{2}:[0-9]{2}$' THEN
    result := input_value;

  -- CASO 3: Tempo sem segundos "HH:MM"
  ELSIF input_value ~ '^[0-9]{1,2}:[0-9]{2}$' THEN
    hours := lpad(split_part(input_value, ':', 1), 2, '0');
    minutes := lpad(split_part(input_value, ':', 2), 2, '0');
    result := hours || ':' || minutes || ':00';

  -- CASO 4: Número decimal (fração de dia do Excel)
  ELSIF input_value ~ '^[0-9]+\.[0-9]+$' THEN
    -- Converte fração de dia para segundos
    hours := floor((input_value::numeric * 24)::int);
    minutes := floor(((input_value::numeric * 24 * 60) - (hours * 60))::int);
    seconds := round(((input_value::numeric * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60))::numeric)::int;

    result := lpad(hours::text, 2, '0') || ':' ||
              lpad(minutes::text, 2, '0') || ':' ||
              lpad(seconds::text, 2, '0');

  -- CASO 5: Qualquer outro formato - tenta extrair números
  ELSE
    -- Usa regex para encontrar padrão de hora
    time_part := (regexp_match(input_value, '([0-9]{1,2}):([0-9]{2})(?::([0-9]{2}))?'))[1];
    IF time_part IS NOT NULL THEN
      result := input_value;
    END IF;
  END IF;

  RETURN result;
END $$;

-- 2) Aplicar trigger para normalizar automaticamente em INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.normalize_time_columns_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.duracao_do_periodo := public.normalize_time_to_hhmmss(NEW.duracao_do_periodo);
  NEW.tempo_disponivel_escalado := public.normalize_time_to_hhmmss(NEW.tempo_disponivel_escalado);
  NEW.tempo_disponivel_absoluto := public.normalize_time_to_hhmmss(NEW.tempo_disponivel_absoluto);
  RETURN NEW;
END $$;

-- Remove trigger antigo se existir
DROP TRIGGER IF EXISTS dados_corridas_normalize_time ON public.dados_corridas;

-- Cria novo trigger
CREATE TRIGGER dados_corridas_normalize_time
BEFORE INSERT OR UPDATE ON public.dados_corridas
FOR EACH ROW EXECUTE FUNCTION public.normalize_time_columns_trigger();

-- 3) Corrigir TODOS os dados existentes na tabela
UPDATE public.dados_corridas
SET
  duracao_do_periodo = public.normalize_time_to_hhmmss(duracao_do_periodo),
  tempo_disponivel_escalado = public.normalize_time_to_hhmmss(tempo_disponivel_escalado),
  tempo_disponivel_absoluto = public.normalize_time_to_hhmmss(tempo_disponivel_absoluto);

-- 4) Verificar resultado (opcional - para confirmar que funcionou)
SELECT
  id,
  duracao_do_periodo,
  tempo_disponivel_escalado,
  tempo_disponivel_absoluto
FROM public.dados_corridas
WHERE duracao_do_periodo IS NOT NULL
LIMIT 5;
