-- Habilitar RLS na tabela de perfis (caso não esteja)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas para evitar conflitos/duplicidade
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

-- 1. Usuários podem ver e editar seu próprio perfil
CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- 2. Admins podem ver TODOS os perfis (para monitoramento e gestão)
CREATE POLICY "Admins can view all profiles"
    ON public.user_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- 3. (Opcional) Se quiser que todos vejam os nomes uns dos outros (ex: Ranking),
-- descomente a linha abaixo. Caso contrário, apenas admins verão os outros.
-- CREATE POLICY "Authenticated users can view all profiles"
--     ON public.user_profiles FOR SELECT
--     USING (auth.role() = 'authenticated');
