-- =====================================================================
-- CONFIGURAÇÃO DO SISTEMA DE AUTENTICAÇÃO E AUTORIZAÇÃO
-- =====================================================================
-- Execute este script no Supabase SQL Editor
-- =====================================================================

-- 1. CRIAR TABELA DE PERFIS DE USUÁRIO
-- =====================================================================
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_approved ON public.user_profiles(is_approved);
CREATE INDEX IF NOT EXISTS idx_user_profiles_admin ON public.user_profiles(is_admin);


-- 2. HABILITAR RLS (Row Level Security)
-- =====================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;


-- 3. POLÍTICAS DE SEGURANÇA (RLS POLICIES)
-- =====================================================================

-- Usuários podem ler seu próprio perfil
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Admins podem ler todos os perfis
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Admins podem atualizar perfis
DROP POLICY IF EXISTS "Admins can update profiles" ON public.user_profiles;
CREATE POLICY "Admins can update profiles"
  ON public.user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Permitir inserção inicial (será controlada por trigger)
DROP POLICY IF EXISTS "Enable insert for new users" ON public.user_profiles;
CREATE POLICY "Enable insert for new users"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);


-- 4. TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
-- =====================================================================
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


-- 5. FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- =====================================================================
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


-- 6. RLS NA TABELA dados_corridas (FILTRO POR PRAÇA)
-- =====================================================================
ALTER TABLE public.dados_corridas ENABLE ROW LEVEL SECURITY;

-- Admins veem tudo
DROP POLICY IF EXISTS "Admins can read all data" ON public.dados_corridas;
CREATE POLICY "Admins can read all data"
  ON public.dados_corridas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
        AND is_admin = TRUE 
        AND is_approved = TRUE
    )
  );

-- Usuários aprovados veem apenas suas praças
DROP POLICY IF EXISTS "Users can read assigned pracas" ON public.dados_corridas;
CREATE POLICY "Users can read assigned pracas"
  ON public.dados_corridas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND is_approved = TRUE
        AND praca = ANY(assigned_pracas)
    )
  );

-- Apenas admins podem inserir dados
DROP POLICY IF EXISTS "Only admins can insert data" ON public.dados_corridas;
CREATE POLICY "Only admins can insert data"
  ON public.dados_corridas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
        AND is_admin = TRUE 
        AND is_approved = TRUE
    )
  );


-- 7. RLS NA MATERIALIZED VIEW
-- =====================================================================
ALTER TABLE public.mv_aderencia_agregada ENABLE ROW LEVEL SECURITY;

-- Admins veem tudo
DROP POLICY IF EXISTS "Admins can read all aggregated data" ON public.mv_aderencia_agregada;
CREATE POLICY "Admins can read all aggregated data"
  ON public.mv_aderencia_agregada
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
        AND is_admin = TRUE 
        AND is_approved = TRUE
    )
  );

-- Usuários aprovados veem apenas suas praças
DROP POLICY IF EXISTS "Users can read assigned pracas aggregated" ON public.mv_aderencia_agregada;
CREATE POLICY "Users can read assigned pracas aggregated"
  ON public.mv_aderencia_agregada
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND is_approved = TRUE
        AND praca = ANY(assigned_pracas)
    )
  );


-- 8. FUNÇÕES AUXILIARES PARA O SISTEMA
-- =====================================================================

-- Função para obter perfil do usuário atual
DROP FUNCTION IF EXISTS public.get_current_user_profile();
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
  SELECT 
    id,
    full_name,
    email,
    is_admin,
    is_approved,
    assigned_pracas
  FROM public.user_profiles
  WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_profile() 
  TO anon, authenticated;


-- Função para listar usuários pendentes (apenas admin)
DROP FUNCTION IF EXISTS public.list_pending_users();
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
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid() 
      AND is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  RETURN QUERY
  SELECT 
    up.id,
    up.full_name,
    up.email,
    up.created_at,
    up.assigned_pracas
  FROM public.user_profiles up
  WHERE up.is_approved = FALSE
  ORDER BY up.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_pending_users() 
  TO authenticated;


-- Função para listar todos os usuários (apenas admin)
DROP FUNCTION IF EXISTS public.list_all_users();
CREATE OR REPLACE FUNCTION public.list_all_users()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  is_admin BOOLEAN,
  is_approved BOOLEAN,
  assigned_pracas TEXT[],
  created_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid() 
      AND is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  RETURN QUERY
  SELECT 
    up.id,
    up.full_name,
    up.email,
    up.is_admin,
    up.is_approved,
    up.assigned_pracas,
    up.created_at,
    up.approved_at
  FROM public.user_profiles up
  ORDER BY up.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_all_users() 
  TO authenticated;


-- Função para aprovar usuário e atribuir praças
DROP FUNCTION IF EXISTS public.approve_user(UUID, TEXT[]);
CREATE OR REPLACE FUNCTION public.approve_user(
  user_id UUID,
  pracas TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
      AND is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  -- Atualizar o usuário
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

GRANT EXECUTE ON FUNCTION public.approve_user(UUID, TEXT[]) 
  TO authenticated;


-- Função para atualizar praças de um usuário
DROP FUNCTION IF EXISTS public.update_user_pracas(UUID, TEXT[]);
CREATE OR REPLACE FUNCTION public.update_user_pracas(
  user_id UUID,
  pracas TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
      AND is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  -- Atualizar as praças
  UPDATE public.user_profiles
  SET assigned_pracas = pracas
  WHERE id = user_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_pracas(UUID, TEXT[]) 
  TO authenticated;


-- Função para revogar acesso de um usuário
DROP FUNCTION IF EXISTS public.revoke_user_access(UUID);
CREATE OR REPLACE FUNCTION public.revoke_user_access(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
      AND is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  -- Revogar acesso
  UPDATE public.user_profiles
  SET 
    is_approved = FALSE,
    assigned_pracas = '{}'
  WHERE id = user_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_user_access(UUID) 
  TO authenticated;


-- 9. CRIAR PRIMEIRO USUÁRIO ADMIN (MANUAL)
-- =====================================================================
-- IMPORTANTE: Após criar sua conta via interface, execute:
-- 
-- UPDATE public.user_profiles
-- SET is_admin = TRUE, is_approved = TRUE
-- WHERE email = 'seu-email@example.com';
--
-- Substitua 'seu-email@example.com' pelo email que você vai usar


-- 10. GRANT PERMISSIONS
-- =====================================================================
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT INSERT ON public.user_profiles TO authenticated;
GRANT UPDATE ON public.user_profiles TO authenticated;


-- =====================================================================
-- VERIFICAÇÃO
-- =====================================================================
SELECT 
  'Tabela user_profiles' as item,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles'
  ) THEN '✅ Criada' ELSE '❌ Não encontrada' END as status
UNION ALL
SELECT 
  'RLS habilitado',
  CASE WHEN (
    SELECT relrowsecurity 
    FROM pg_class 
    WHERE relname = 'user_profiles'
  ) THEN '✅ Sim' ELSE '❌ Não' END
UNION ALL
SELECT 
  'Políticas criadas',
  CASE WHEN (
    SELECT COUNT(*) 
    FROM pg_policies 
    WHERE tablename = 'user_profiles'
  ) > 0 THEN '✅ ' || (
    SELECT COUNT(*)::TEXT 
    FROM pg_policies 
    WHERE tablename = 'user_profiles'
  ) || ' políticas' ELSE '❌ Nenhuma' END;
