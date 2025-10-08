# 📚 GUIA COMPLETO SQL - DASHBOARD OPERACIONAL

## 🎯 ÍNDICE

1. [Criação Inicial do Banco](#1-criação-inicial-do-banco)
2. [Sistema de Autenticação](#2-sistema-de-autenticação)  
3. [Performance e Otimização](#3-performance-e-otimização)
4. [Funções do Dashboard](#4-funções-do-dashboard)
5. [Correções e Manutenção](#5-correções-e-manutenção)
6. [Backup e Recuperação](#6-backup-e-recuperação)

---

## 1. CRIAÇÃO INICIAL DO BANCO

### 1.1 Tabela Principal: `dados_corridas`

```sql
-- Criar tabela principal
CREATE TABLE IF NOT EXISTS public.dados_corridas (
  id BIGSERIAL PRIMARY KEY,
  data_do_periodo DATE,
  periodo TEXT,
  duracao_do_periodo TEXT,
  numero_minimo_de_entregadores_regulares_na_escala NUMERIC,
  tag TEXT,
  id_da_pessoa_entregadora TEXT,
  pessoa_entregadora TEXT,
  praca TEXT,
  sub_praca TEXT,
  origem TEXT,
  tempo_disponivel_escalado TEXT,
  tempo_disponivel_absoluto TEXT,
  numero_de_corridas_ofertadas NUMERIC DEFAULT 0,
  numero_de_corridas_aceitas NUMERIC DEFAULT 0,
  numero_de_corridas_rejeitadas NUMERIC DEFAULT 0,
  numero_de_corridas_completadas NUMERIC DEFAULT 0,
  numero_de_corridas_canceladas_pela_pessoa_entregadora NUMERIC DEFAULT 0,
  numero_de_pedidos_aceitos_e_concluidos NUMERIC DEFAULT 0,
  soma_das_taxas_das_corridas_aceitas NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2 Normalização de Tempos (HH:MM:SS)

```sql
-- Função para normalizar tempo
CREATE OR REPLACE FUNCTION public.normalize_time_to_hhmmss(input_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result text := '00:00:00';
BEGIN
  IF input_value IS NULL OR trim(input_value) = '' THEN
    RETURN result;
  END IF;

  input_value := trim(input_value);

  -- Formato ISO: 1899-12-30T07:05:28.000Z
  IF input_value LIKE '%T%:%:%Z' THEN
    result := split_part(split_part(input_value, 'T', 2), '.', 1);

  -- Formato numérico (fração de dia)
  ELSIF input_value ~ '^[0-9]+\\.[0-9]+$' THEN
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

  -- Já está no formato HH:MM:SS
  ELSIF input_value ~ '^[0-9]{1,2}:[0-9]{2}:[0-9]{2}$' THEN
    result := input_value;
  ELSE
    result := input_value;
  END IF;

  RETURN result;
END $$;

-- Trigger para normalizar automaticamente
CREATE OR REPLACE FUNCTION public.normalize_time_columns_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.duracao_do_periodo := normalize_time_to_hhmmss(NEW.duracao_do_periodo);
  NEW.tempo_disponivel_escalado := normalize_time_to_hhmmss(NEW.tempo_disponivel_escalado);
  NEW.tempo_disponivel_absoluto := normalize_time_to_hhmmss(NEW.tempo_disponivel_absoluto);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dados_corridas_normalize_time ON public.dados_corridas;
CREATE TRIGGER dados_corridas_normalize_time
  BEFORE INSERT OR UPDATE ON public.dados_corridas
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_time_columns_trigger();
```

### 1.3 Colunas Derivadas para Performance

```sql
-- Adicionar colunas para armazenar tempo em segundos
ALTER TABLE public.dados_corridas 
  ADD COLUMN IF NOT EXISTS duracao_segundos NUMERIC,
  ADD COLUMN IF NOT EXISTS tempo_disponivel_escalado_segundos NUMERIC,
  ADD COLUMN IF NOT EXISTS tempo_disponivel_absoluto_segundos NUMERIC;

-- Adicionar colunas para data parts (ISO)
ALTER TABLE public.dados_corridas 
  ADD COLUMN IF NOT EXISTS ano_iso INTEGER,
  ADD COLUMN IF NOT EXISTS semana_numero INTEGER,
  ADD COLUMN IF NOT EXISTS dia_iso INTEGER;

-- Função para converter HH:MM:SS para segundos
CREATE OR REPLACE FUNCTION public.hhmmss_to_seconds(value text)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  parts text[];
  hours int := 0;
  minutes int := 0;
  seconds int := 0;
BEGIN
  IF value IS NULL OR trim(value) = '' THEN
    RETURN 0;
  END IF;

  parts := string_to_array(value, ':');
  
  IF array_length(parts, 1) = 3 THEN
    hours := COALESCE(parts[1]::int, 0);
    minutes := COALESCE(parts[2]::int, 0);
    seconds := COALESCE(parts[3]::int, 0);
    RETURN (hours * 3600) + (minutes * 60) + seconds;
  END IF;

  RETURN 0;
END;
$$;

-- Trigger para popular colunas derivadas
CREATE OR REPLACE FUNCTION public.populate_derived_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Converter tempos para segundos
  NEW.duracao_segundos := hhmmss_to_seconds(NEW.duracao_do_periodo);
  NEW.tempo_disponivel_escalado_segundos := hhmmss_to_seconds(NEW.tempo_disponivel_escalado);
  NEW.tempo_disponivel_absoluto_segundos := hhmmss_to_seconds(NEW.tempo_disponivel_absoluto);
  
  -- Popular date parts
  IF NEW.data_do_periodo IS NOT NULL THEN
    NEW.ano_iso := date_part('isoyear', NEW.data_do_periodo)::int;
    NEW.semana_numero := date_part('week', NEW.data_do_periodo)::int;
    NEW.dia_iso := date_part('isodow', NEW.data_do_periodo)::int;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_populate_derived ON public.dados_corridas;
CREATE TRIGGER trigger_populate_derived
  BEFORE INSERT OR UPDATE ON public.dados_corridas
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_derived_columns();
```

### 1.4 Índices para Performance

```sql
-- Índices principais
CREATE INDEX IF NOT EXISTS idx_dados_corridas_data ON public.dados_corridas(data_do_periodo);
CREATE INDEX IF NOT EXISTS idx_dados_corridas_praca ON public.dados_corridas(praca);
CREATE INDEX IF NOT EXISTS idx_dados_corridas_sub_praca ON public.dados_corridas(sub_praca);
CREATE INDEX IF NOT EXISTS idx_dados_corridas_origem ON public.dados_corridas(origem);
CREATE INDEX IF NOT EXISTS idx_dados_corridas_ano_iso ON public.dados_corridas(ano_iso);
CREATE INDEX IF NOT EXISTS idx_dados_corridas_semana ON public.dados_corridas(semana_numero);

-- Índices compostos
CREATE INDEX IF NOT EXISTS idx_dados_corridas_ano_semana 
  ON public.dados_corridas (ano_iso, semana_numero) 
  WHERE ano_iso IS NOT NULL AND semana_numero IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dados_corridas_tempo_disponivel 
  ON public.dados_corridas (tempo_disponivel_absoluto_segundos) 
  WHERE tempo_disponivel_absoluto_segundos > 0;

-- Atualizar estatísticas
ANALYZE public.dados_corridas;
```

---

## 2. SISTEMA DE AUTENTICAÇÃO

### 2.1 Tabela de Perfis de Usuário

```sql
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  assigned_pracas TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_approved ON public.user_profiles(is_approved);
CREATE INDEX IF NOT EXISTS idx_user_profiles_admin ON public.user_profiles(is_admin);
```

### 2.2 Row Level Security (RLS)

```sql
-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dados_corridas ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON public.user_profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  ));

CREATE POLICY "Admins can update profiles"
  ON public.user_profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  ));

CREATE POLICY "Enable insert for new users"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Políticas para dados_corridas
CREATE POLICY "Admins can read all data"
  ON public.dados_corridas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid() 
      AND user_profiles.is_admin = TRUE 
      AND user_profiles.is_approved = TRUE
  ));

CREATE POLICY "Users can read assigned pracas"
  ON public.dados_corridas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_approved = TRUE
      AND user_profiles.is_admin = FALSE
      AND dados_corridas.praca = ANY(user_profiles.assigned_pracas)
  ));

CREATE POLICY "Only admins can insert data"
  ON public.dados_corridas FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid() 
      AND user_profiles.is_admin = TRUE 
      AND user_profiles.is_approved = TRUE
  ));
```

### 2.3 Triggers de Usuário

```sql
-- Criar perfil automaticamente no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_profile_updated ON public.user_profiles;
CREATE TRIGGER on_user_profile_updated
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### 2.4 Funções RPC de Administração

```sql
-- Obter perfil do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  is_admin BOOLEAN,
  is_approved BOOLEAN,
  assigned_pracas TEXT[]
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, full_name, email, is_admin, is_approved, assigned_pracas
  FROM public.user_profiles
  WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO anon, authenticated;

-- Listar usuários pendentes
CREATE OR REPLACE FUNCTION public.list_pending_users()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ,
  assigned_pracas TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  RETURN QUERY
  SELECT up.id, up.full_name, up.email, up.created_at, up.assigned_pracas
  FROM public.user_profiles up
  WHERE up.is_approved = FALSE
  ORDER BY up.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_pending_users() TO authenticated;

-- Aprovar usuário
CREATE OR REPLACE FUNCTION public.approve_user(user_id UUID, pracas TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  UPDATE public.user_profiles
  SET 
    is_approved = TRUE,
    assigned_pracas = pracas,
    approved_at = NOW(),
    approved_by = auth.uid()
  WHERE id = user_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_user(UUID, TEXT[]) TO authenticated;

-- Listar praças disponíveis (otimizado)
CREATE OR REPLACE FUNCTION public.list_pracas_disponiveis()
RETURNS TABLE (praca TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT dados_corridas.praca
  FROM public.dados_corridas
  WHERE dados_corridas.praca IS NOT NULL
  ORDER BY dados_corridas.praca;
$$;

GRANT EXECUTE ON FUNCTION public.list_pracas_disponiveis() TO authenticated, anon;
```

---

## 3. PERFORMANCE E OTIMIZAÇÃO

### 3.1 Materialized View para Aderência

```sql
-- Criar materialized view
DROP MATERIALIZED VIEW IF EXISTS public.mv_aderencia_agregada CASCADE;

CREATE MATERIALIZED VIEW public.mv_aderencia_agregada AS
SELECT 
  ano_iso,
  semana_numero,
  dia_iso,
  periodo,
  praca,
  sub_praca,
  origem,
  data_do_periodo,
  duracao_segundos,
  numero_minimo_de_entregadores_regulares_na_escala,
  (COALESCE(numero_minimo_de_entregadores_regulares_na_escala, 0) * 
   COALESCE(duracao_segundos, 0)) AS segundos_planejados,
  row_number() OVER () AS row_id
FROM (
  SELECT DISTINCT ON (
    data_do_periodo, periodo, duracao_segundos,
    numero_minimo_de_entregadores_regulares_na_escala,
    praca, sub_praca, origem
  )
    ano_iso, semana_numero, dia_iso, periodo, praca, sub_praca, origem,
    data_do_periodo, duracao_segundos,
    numero_minimo_de_entregadores_regulares_na_escala
  FROM public.dados_corridas
  WHERE data_do_periodo IS NOT NULL
    AND duracao_segundos IS NOT NULL
    AND duracao_segundos > 0
  ORDER BY 
    data_do_periodo, periodo, duracao_segundos,
    numero_minimo_de_entregadores_regulares_na_escala,
    praca, sub_praca, origem, id
) AS unique_records;

-- Criar índice único (necessário para CONCURRENTLY)
CREATE UNIQUE INDEX idx_mv_aderencia_row_id 
  ON public.mv_aderencia_agregada (row_id);

-- Criar índices adicionais
CREATE INDEX idx_mv_aderencia_ano_semana ON public.mv_aderencia_agregada (ano_iso, semana_numero);
CREATE INDEX idx_mv_aderencia_dia ON public.mv_aderencia_agregada (dia_iso);
CREATE INDEX idx_mv_aderencia_periodo ON public.mv_aderencia_agregada (periodo);
CREATE INDEX idx_mv_aderencia_praca ON public.mv_aderencia_agregada (praca);

ANALYZE public.mv_aderencia_agregada;
```

### 3.2 Função para Refresh da MV

```sql
-- Função para refresh (com CONCURRENTLY para não bloquear)
CREATE OR REPLACE FUNCTION public.refresh_mv_aderencia()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '300000ms'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_aderencia_agregada;
  ANALYZE public.mv_aderencia_agregada;
  RAISE NOTICE 'Materialized view atualizada com sucesso';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao atualizar materialized view: %', SQLERRM;
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_mv_aderencia() TO authenticated, service_role;
```

---

## 4. FUNÇÕES DO DASHBOARD

### 4.1 Dashboard Resumo (Função Principal)

```sql
-- Função consolidada que retorna todos os dados do dashboard
CREATE OR REPLACE FUNCTION public.dashboard_resumo(
  p_ano integer DEFAULT NULL,
  p_semana integer DEFAULT NULL,
  p_praca text DEFAULT NULL,
  p_sub_praca text DEFAULT NULL,
  p_origem text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '60000ms'
AS $$
-- [Código completo está no arquivo dashboard_rpc.sql]
-- Esta função retorna um JSON com: totais, semanal, dia, turno, sub_praca, origem, dimensoes
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_resumo(integer, integer, text, text, text)
  TO anon, authenticated, service_role;
```

---

## 5. CORREÇÕES E MANUTENÇÃO

### 5.1 Atualizar Dados Existentes (Batch)

```sql
-- Atualizar dados existentes em lotes de 10.000
UPDATE public.dados_corridas
SET 
  ano_iso = date_part('isoyear', data_do_periodo)::int,
  semana_numero = date_part('week', data_do_periodo)::int,
  dia_iso = date_part('isodow', data_do_periodo)::int,
  duracao_segundos = hhmmss_to_seconds(duracao_do_periodo),
  tempo_disponivel_escalado_segundos = hhmmss_to_seconds(tempo_disponivel_escalado),
  tempo_disponivel_absoluto_segundos = hhmmss_to_seconds(tempo_disponivel_absoluto)
WHERE id IN (
  SELECT id 
  FROM public.dados_corridas 
  WHERE ano_iso IS NULL 
    AND data_do_periodo IS NOT NULL
  LIMIT 10000
);
-- Execute múltiplas vezes até atualizar todos
```

### 5.2 VACUUM e Reindex

```sql
-- Executar mensalmente ou após grandes operações
VACUUM ANALYZE public.dados_corridas;
VACUUM ANALYZE public.user_profiles;
VACUUM ANALYZE public.mv_aderencia_agregada;

-- Reindex (se necessário)
-- REINDEX TABLE CONCURRENTLY public.dados_corridas;
```

---

## 6. BACKUP E RECUPERAÇÃO

### 6.1 Backup da Estrutura

```sql
-- Copie a saída deste comando para backup
SELECT 
  'CREATE TABLE ' || schemaname || '.' || tablename || ' (' ||
  string_agg(column_name || ' ' || data_type, ', ') || ');'
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'dados_corridas'
GROUP BY schemaname, tablename;
```

### 6.2 Criar Admin de Emergência

```sql
-- Se perder acesso, crie um admin via SQL
UPDATE public.user_profiles
SET is_admin = TRUE, is_approved = TRUE
WHERE email = 'seu-email@example.com';
```

### 6.3 Verificar Integridade

```sql
-- Verificar se tabelas existem
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar se funções existem
SELECT proname 
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;

-- Verificar políticas RLS
SELECT * FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 7. COMANDOS ÚTEIS

### 7.1 Limpar Cache e Otimizar

```sql
-- Atualizar estatísticas
ANALYZE;

-- Ver tamanho das tabelas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 7.2 Monitorar Performance

```sql
-- Ver queries lentas
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## 8. ORDEM DE EXECUÇÃO PARA SETUP COMPLETO

1. ✅ Criar tabela `dados_corridas`
2. ✅ Adicionar colunas derivadas
3. ✅ Criar funções de normalização
4. ✅ Criar triggers
5. ✅ Criar índices
6. ✅ Criar tabela `user_profiles`
7. ✅ Configurar RLS
8. ✅ Criar funções RPC
9. ✅ Criar materialized view
10. ✅ Popular dados existentes (batch)
11. ✅ Refresh MV
12. ✅ ANALYZE final

---

**FIM DO GUIA**
