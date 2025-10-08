-- =====================================================================
-- CORREÇÃO DO FILTRO POR PRAÇA (RLS)
-- =====================================================================
-- Execute no Supabase SQL Editor
-- =====================================================================

-- 1. RECRIAR POLÍTICA DE LEITURA PARA USUÁRIOS NÃO-ADMIN
-- =====================================================================

-- Dropar política antiga
DROP POLICY IF EXISTS "Users can read assigned pracas" ON public.dados_corridas;

-- Criar política corrigida
CREATE POLICY "Users can read assigned pracas"
  ON public.dados_corridas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.is_approved = TRUE
        AND user_profiles.is_admin = FALSE
        AND dados_corridas.praca = ANY(user_profiles.assigned_pracas)
    )
  );


-- 2. RECRIAR POLÍTICA PARA ADMIN (SEM MUDANÇAS, MAS GARANTINDO QUE EXISTE)
-- =====================================================================

DROP POLICY IF EXISTS "Admins can read all data" ON public.dados_corridas;

CREATE POLICY "Admins can read all data"
  ON public.dados_corridas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid() 
        AND user_profiles.is_admin = TRUE 
        AND user_profiles.is_approved = TRUE
    )
  );


-- 3. MESMA CORREÇÃO PARA MATERIALIZED VIEW (se houver)
-- =====================================================================

-- Para mv_aderencia_agregada (se você tiver criado o RLS nela)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename = 'mv_aderencia_agregada'
  ) THEN
    
    -- Dropar políticas antigas
    EXECUTE 'DROP POLICY IF EXISTS "Users can read assigned pracas aggregated" ON public.mv_aderencia_agregada';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read all aggregated data" ON public.mv_aderencia_agregada';
    
    -- Criar políticas novas
    EXECUTE 'CREATE POLICY "Admins can read all aggregated data" 
      ON public.mv_aderencia_agregada 
      FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE user_profiles.id = auth.uid() 
            AND user_profiles.is_admin = TRUE 
            AND user_profiles.is_approved = TRUE
        )
      )';
    
    EXECUTE 'CREATE POLICY "Users can read assigned pracas aggregated"
      ON public.mv_aderencia_agregada
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_approved = TRUE
            AND user_profiles.is_admin = FALSE
            AND mv_aderencia_agregada.praca = ANY(user_profiles.assigned_pracas)
        )
      )';
  END IF;
END $$;


-- 4. VERIFICAÇÃO
-- =====================================================================

-- Ver políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('dados_corridas', 'mv_aderencia_agregada')
ORDER BY tablename, policyname;


-- Testar se está funcionando (execute como usuário não-admin)
-- SELECT COUNT(*), praca 
-- FROM dados_corridas 
-- GROUP BY praca;
