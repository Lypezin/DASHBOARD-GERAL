-- 1. Updates for HEARTBEAT monitoring
ALTER TABLE public.user_activity_logs 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT now();

-- Update existing rows to have last_seen = entered_at if null
UPDATE public.user_activity_logs SET last_seen = entered_at WHERE last_seen IS NULL;

-- 2. Schema Updates for Badges
-- Ensure criteria_type exists (it seems it does, but good to be safe if it's missing from my previous run perspective)
-- The error said "threshold" violates not-null, so "threshold" exists. Best to stick to that.

-- 3. New Badges
-- Using 'threshold' instead of 'criteria_value'
INSERT INTO public.gamification_badges (slug, name, description, icon, category, criteria_type, threshold)
VALUES 
('night_owl', 'Coruja Noturna', 'Acessou o dashboard durante a madrugada (22h - 05h).', 'Moon', 'atividade', 'custom', 1),
('marathon', 'Maratonista', 'Permaneceu online por mais de 2 horas seguidas.', 'Clock', 'atividade', 'duration', 7200),
('analyst_pro', 'Analista Pro', 'Acessou todas as abas de análise em um único dia.', 'Eye', 'performance', 'custom', 1),
('data_miner', 'Minerador de Dados', 'Exportou relatórios 10 vezes.', 'Download', 'performance', 'count', 10)
ON CONFLICT (slug) DO UPDATE 
SET 
    criteria_type = EXCLUDED.criteria_type,
    threshold = EXCLUDED.threshold,
    icon = EXCLUDED.icon;
