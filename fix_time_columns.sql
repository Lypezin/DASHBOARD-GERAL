-- =================================================================
-- SOLUÇÃO ULTRA-SIMPLIFICADA PARA CORRIGIR COLUNAS DE TEMPO
-- Execute este script SEÇÃO POR SEÇÃO no SQL Editor do Supabase
-- =================================================================

-- SEÇÃO 1: LIMPEZA TOTAL (execute primeiro)
DROP TRIGGER IF EXISTS dados_corridas_normalize_time ON public.dados_corridas;
DROP FUNCTION IF EXISTS public.normalize_time_columns_trigger();
DROP FUNCTION IF EXISTS public.normalize_time_to_hhmmss(text);
DROP FUNCTION IF EXISTS public.normalize_time_to_hhmmss(varchar);
DROP FUNCTION IF EXISTS public.normalize_time_to_hhmmss_simple(text);
DROP FUNCTION IF EXISTS public.normalize_time_hhmmss_fixed(text);

-- Forçar limpeza de qualquer função relacionada
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT oid FROM pg_proc WHERE proname LIKE '%normalize%' OR proname LIKE '%time%'
    LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.oid || ' CASCADE';
        EXCEPTION WHEN OTHERS THEN
            -- Ignorar erros de DROP
            CONTINUE;
        END;
    END LOOP;
END $$;

-- SEÇÃO 2: CRIAR FUNÇÃO ULTRA-SIMPLIFICADA (execute depois da limpeza)
CREATE OR REPLACE FUNCTION public.normalize_time_to_hhmmss(input_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result text := '00:00:00';
  time_part text;
BEGIN
  -- Trata valores nulos ou vazios
  IF input_value IS NULL OR trim(input_value) = '' THEN
    RETURN result;
  END IF;

  input_value := trim(input_value);

  -- CASO PRINCIPAL: String com formato "1899-12-30T05:59:36.000Z"
  -- Extrai apenas a parte do tempo após 'T'
  IF input_value LIKE '%T%:%:%Z' THEN
    time_part := split_part(input_value, 'T', 2);
    time_part := split_part(time_part, '.', 1); -- Remove milissegundos
    result := time_part;

  -- CASO 2: Número decimal (fração de dia)
  ELSIF input_value ~ '^[0-9]+\.[0-9]+$' THEN
    DECLARE
      total_seconds int := round((input_value::numeric * 86400)::numeric);
      hours int := floor(total_seconds / 3600);
      minutes int := floor((total_seconds % 3600) / 60);
      seconds int := total_seconds % 60;
    BEGIN
      result := lpad(hours::text, 2, '0') || ':' ||
                lpad(minutes::text, 2, '0') || ':' ||
                lpad(seconds::text, 2, '0');
    END;

  -- CASO 3: Já está no formato correto
  ELSIF input_value ~ '^[0-9]{1,2}:[0-9]{2}:[0-9]{2}$' THEN
    result := input_value;

  -- CASO 4: Qualquer outro formato - mantém como está
  ELSE
    result := input_value;
  END IF;

  RETURN result;
END $$;

-- SEÇÃO 3: CRIAR TRIGGER (execute depois da função)
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

CREATE TRIGGER dados_corridas_normalize_time
BEFORE INSERT OR UPDATE ON public.dados_corridas
FOR EACH ROW EXECUTE FUNCTION public.normalize_time_columns_trigger();

-- SEÇÃO 4: CORRIGIR DADOS EXISTENTES (execute depois do trigger)
UPDATE public.dados_corridas
SET
  duracao_do_periodo = public.normalize_time_to_hhmmss(duracao_do_periodo),
  tempo_disponivel_escalado = public.normalize_time_to_hhmmss(tempo_disponivel_escalado),
  tempo_disponivel_absoluto = public.normalize_time_to_hhmmss(tempo_disponivel_absoluto);

-- SEÇÃO 5: VER AMOSTRA DOS DADOS (execute depois da correção)
SELECT
  id,
  duracao_do_periodo,
  tempo_disponivel_escalado,
  tempo_disponivel_absoluto
FROM public.dados_corridas
ORDER BY id
LIMIT 15;
