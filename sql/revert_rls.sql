-- Reverter RLS para o estado básico (seguro, sem recursão)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Remover as políticas recursivas e conflitantes
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

-- Restaurar APENAS a política básica de ver o próprio perfil
CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Para permitir que o Admin veja logs (que dependem de user_profiles) sem quebrar tudo,
-- precisamos que os perfis sejam visíveis ou remover a dependência.
-- Opção segura temporária: Permitir leitura pública de nomes/avatars (comum em dashboards)
-- SE quiser tentar corrigir a visibilidade:
CREATE POLICY "Authenticated users can view basic info"
    ON public.user_profiles FOR SELECT
    USING (auth.role() = 'authenticated');
