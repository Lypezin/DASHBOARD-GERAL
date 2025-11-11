-- =====================================================================
-- CORREÇÕES DE SEGURANÇA - AUDITORIA
-- =====================================================================
-- Este script aplica as correções críticas de segurança identificadas na auditoria.
--
-- 1. Habilita RLS (Row Level Security) em tabelas críticas.
-- 2. Adiciona políticas de acesso restritivas.
-- 3. Corrige funções vulneráveis definindo um search_path seguro.
-- =====================================================================

BEGIN;

-- 1. HABILITAR RLS EM TABELAS EXPOSTAS
-- ---------------------------------------------------------------------

-- Habilita RLS na tabela principal de dados, que estava desabilitado.
ALTER TABLE public.dados_corridas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dados_corridas FORCE ROW LEVEL SECURITY; -- Garante que RLS se aplique a todos, incluindo o dono da tabela.

-- Habilita RLS na tabela de backups, que não tinha nenhuma proteção.
ALTER TABLE public.backup_otimizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_otimizacao FORCE ROW LEVEL SECURITY;

-- 2. CRIAR POLÍTICAS DE ACESSO
-- ---------------------------------------------------------------------

-- Garante que apenas administradores possam acessar a tabela de backups.
DROP POLICY IF EXISTS "Only admins can access backup_otimizacao" ON public.backup_otimizacao;
CREATE POLICY "Only admins can access backup_otimizacao"
ON public.backup_otimizacao
FOR ALL
USING (
  (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) = true
)
WITH CHECK (
  (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) = true
);


-- 3. CORRIGIR FUNÇÕES VULNERÁVEIS (search_path)
-- ---------------------------------------------------------------------
-- Adiciona SET search_path para mitigar riscos de SQL injection.

-- Função: get_current_user_profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(is_admin boolean, assigned_pracas text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth AS -- CORRIGIDO
$function$
BEGIN
  RETURN QUERY
  SELECT
    up.is_admin,
    up.assigned_pracas
  FROM public.user_profiles up
  WHERE up.id = auth.uid();
END;
$function$;

-- Função: approve_user
CREATE OR REPLACE FUNCTION public.approve_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth AS -- CORRIGIDO
$function$
BEGIN
    IF NOT (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Apenas administradores podem aprovar usuários';
    END IF;

    UPDATE public.user_profiles
    SET is_approved = true,
        approved_at = NOW(),
        approved_by = auth.uid(),
        status = 'approved'
    WHERE id = p_user_id;
END;
$function$;

-- Função: update_user_pracas
CREATE OR REPLACE FUNCTION public.update_user_pracas(p_user_id uuid, p_pracas text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth AS -- CORRIGIDO
$function$
BEGIN
    IF NOT (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Apenas administradores podem alterar praças';
    END IF;

    UPDATE public.user_profiles
    SET assigned_pracas = p_pracas,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$function$;

-- Função: set_user_admin
CREATE OR REPLACE FUNCTION public.set_user_admin(p_user_id uuid, p_is_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth AS -- CORRIGIDO
$function$
BEGIN
    IF NOT (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Apenas administradores podem alterar permissões de admin';
    END IF;

    UPDATE public.user_profiles
    SET is_admin = p_is_admin,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$function$;

-- Função: revoke_user_access
CREATE OR REPLACE FUNCTION public.revoke_user_access(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth AS -- CORRIGIDO
$function$
BEGIN
    IF NOT (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Apenas administradores podem revogar acesso';
    END IF;

    UPDATE public.user_profiles
    SET is_approved = false,
        status = 'revoked'
    WHERE id = p_user_id;
END;
$function$;

COMMIT;
