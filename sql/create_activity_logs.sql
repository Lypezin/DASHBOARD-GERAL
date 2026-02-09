-- Tabela para logs de atividade do usuário
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    path TEXT NOT NULL,
    entered_at TIMESTAMPTZ DEFAULT now(),
    exited_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    last_seen TIMESTAMPTZ DEFAULT now()
);

-- Garantir que a coluna last_seen existe (caso a tabela já existisse sem ela)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_activity_logs' AND column_name = 'last_seen') THEN
        ALTER TABLE public.user_activity_logs ADD COLUMN last_seen TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity_logs(entered_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_path ON public.user_activity_logs(path);

-- Habilitar RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas para evitar erro de duplicidade
DROP POLICY IF EXISTS "Users can insert their own logs" ON public.user_activity_logs;
DROP POLICY IF EXISTS "Users can update their own logs" ON public.user_activity_logs;
DROP POLICY IF EXISTS "Admins can view all logs" ON public.user_activity_logs;

-- Política para usuários inserirem seus próprios logs
CREATE POLICY "Users can insert their own logs"
    ON public.user_activity_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem seus próprios logs (ex: saída da página)
CREATE POLICY "Users can update their own logs"
    ON public.user_activity_logs FOR UPDATE
    USING (auth.uid() = user_id);

-- Política para admins verem todos os logs
CREATE POLICY "Admins can view all logs"
    ON public.user_activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );
