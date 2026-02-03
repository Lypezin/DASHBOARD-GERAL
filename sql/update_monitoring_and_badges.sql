-- 1. Updates for HEARTBEAT monitoring
ALTER TABLE public.user_activity_logs 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT now();

-- Update existing rows to have last_seen = entered_at if null
UPDATE public.user_activity_logs SET last_seen = entered_at WHERE last_seen IS NULL;

-- 2. New Badges (Insert if not conflict)
INSERT INTO public.gamification_badges (slug, name, description, icon, category)
VALUES 
('night_owl', 'Coruja Noturna', 'Acessou o dashboard durante a madrugada (22h - 05h).', 'Moon', 'atividade'),
('marathon', 'Maratonista', 'Permaneceu online por mais de 2 horas seguidas.', 'Clock', 'atividade'),
('analyst_pro', 'Analista Pro', 'Acessou todas as abas de análise em um único dia.', 'Eye', 'performance'),
('data_miner', 'Minerador de Dados', 'Exportou relatórios 10 vezes.', 'Download', 'performance')
ON CONFLICT (slug) DO NOTHING;
