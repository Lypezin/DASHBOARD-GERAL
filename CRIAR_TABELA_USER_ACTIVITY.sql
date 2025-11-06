-- =====================================================
-- CRIAR TABELA USER_ACTIVITY
-- Execute este SQL PRIMEIRO no Supabase
-- =====================================================

-- Criar tabela de atividades do usuário
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'tab_change', 'filter_change', 'search', 'page_load', etc.
  action_details TEXT,
  tab_name TEXT,
  filters_applied JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_action_type ON public.user_activity(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_tab_name ON public.user_activity(tab_name);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_action ON public.user_activity(user_id, action_type);

-- RLS (Row Level Security)
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem ver suas próprias atividades" ON public.user_activity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias atividades" ON public.user_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para admins (comentada - adicionar depois se necessário)
-- CREATE POLICY "Admins podem ver todas as atividades" ON public.user_activity
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM auth.users
--       WHERE id = auth.uid()
--     )
--   );

-- Função para registrar atividade
CREATE OR REPLACE FUNCTION public.registrar_atividade(
  p_session_id TEXT,
  p_action_type TEXT,
  p_action_details TEXT DEFAULT NULL,
  p_tab_name TEXT DEFAULT NULL,
  p_filters_applied JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO public.user_activity (
    user_id,
    session_id,
    action_type,
    action_details,
    tab_name,
    filters_applied
  ) VALUES (
    auth.uid(),
    p_session_id,
    p_action_type,
    p_action_details,
    p_tab_name,
    p_filters_applied
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.registrar_atividade(TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated, anon;

-- Comentários
COMMENT ON TABLE public.user_activity IS 'Registra atividades dos usuários no sistema para gamificação e analytics';
COMMENT ON FUNCTION public.registrar_atividade IS 'Registra uma atividade do usuário no sistema';

-- Verificar se funcionou
SELECT 'Tabela user_activity criada com sucesso!' as status;

