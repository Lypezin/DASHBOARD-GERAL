-- 1. Alter Table gamification_user_stats
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gamification_user_stats' AND column_name = 'last_interaction_at') THEN
        ALTER TABLE gamification_user_stats ADD COLUMN last_interaction_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gamification_user_stats' AND column_name = 'session_start_at') THEN
        ALTER TABLE gamification_user_stats ADD COLUMN session_start_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gamification_user_stats' AND column_name = 'daily_tabs_visited') THEN
        ALTER TABLE gamification_user_stats ADD COLUMN daily_tabs_visited TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gamification_user_stats' AND column_name = 'last_daily_reset') THEN
        ALTER TABLE gamification_user_stats ADD COLUMN last_daily_reset DATE DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- 2. Update register_interaction Logic
CREATE OR REPLACE FUNCTION public.register_interaction(p_interaction_type text)
 RETURNS TABLE(new_badge_slug text, new_badge_name text, new_badge_description text, new_badge_icon text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_id UUID;
    v_today DATE := CURRENT_DATE;
    v_now TIMESTAMPTZ := NOW();
    v_hour INTEGER;
    v_user_stats public.gamification_user_stats%ROWTYPE;
    v_badge RECORD;
    v_session_duration INTERVAL;
    v_has_reset_daily BOOLEAN := FALSE;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Buscar ou Criar Stats
    SELECT * INTO v_user_stats FROM public.gamification_user_stats WHERE user_id = v_user_id;
    IF NOT FOUND THEN
        INSERT INTO public.gamification_user_stats (
            user_id, login_streak, last_login_date, 
            last_interaction_at, session_start_at, daily_tabs_visited, last_daily_reset
        )
        VALUES (
            v_user_id, 0, NULL, 
            v_now, v_now, ARRAY[]::TEXT[], v_today
        )
        RETURNING * INTO v_user_stats;
    END IF;

    -- 0. Daily Reset Logic (Analista Pro)
    IF v_user_stats.last_daily_reset IS NULL OR v_user_stats.last_daily_reset < v_today THEN
        UPDATE public.gamification_user_stats 
        SET daily_tabs_visited = ARRAY[]::TEXT[], last_daily_reset = v_today 
        WHERE user_id = v_user_id;
        v_user_stats.daily_tabs_visited := ARRAY[]::TEXT[];
        v_user_stats.last_daily_reset := v_today;
        v_has_reset_daily := TRUE;
    END IF;

    -- 1. Session Logic (Maratonista)
    -- Se última interação foi há mais de 30min, resetar sessão
    IF v_user_stats.last_interaction_at IS NULL OR (v_now - v_user_stats.last_interaction_at) > INTERVAL '30 minutes' THEN
        UPDATE public.gamification_user_stats SET session_start_at = v_now WHERE user_id = v_user_id;
        v_user_stats.session_start_at := v_now;
    END IF;

    -- Atualizar timestamp da última interação sempre
    UPDATE public.gamification_user_stats SET last_interaction_at = v_now WHERE user_id = v_user_id;
    v_user_stats.last_interaction_at := v_now;

    -- 2. Interaction Specific Logic
    IF p_interaction_type = 'login' THEN
        -- Lógica de Login Streak (Mantida)
        IF v_user_stats.last_login_date IS NULL OR v_user_stats.last_login_date < (v_today - 1) THEN
            UPDATE public.gamification_user_stats SET login_streak = 1, last_login_date = v_today WHERE user_id = v_user_id;
        ELSIF v_user_stats.last_login_date = (v_today - 1) THEN
            UPDATE public.gamification_user_stats SET login_streak = login_streak + 1, last_login_date = v_today WHERE user_id = v_user_id;
        END IF;
    ELSIF p_interaction_type = 'view_comparacao' THEN
        UPDATE public.gamification_user_stats 
        SET view_count_comparacao = COALESCE(view_count_comparacao, 0) + 1,
            daily_tabs_visited = array_append(daily_tabs_visited, 'view_comparacao') 
        WHERE user_id = v_user_id AND NOT ('view_comparacao' = ANY(daily_tabs_visited));
    ELSIF p_interaction_type = 'view_resumo' THEN
        UPDATE public.gamification_user_stats 
        SET view_count_resumo = COALESCE(view_count_resumo, 0) + 1,
            daily_tabs_visited = array_append(daily_tabs_visited, 'view_resumo')
        WHERE user_id = v_user_id AND NOT ('view_resumo' = ANY(daily_tabs_visited));
    ELSIF p_interaction_type = 'view_entregadores' THEN
        UPDATE public.gamification_user_stats 
        SET view_count_entregadores = COALESCE(view_count_entregadores, 0) + 1,
            daily_tabs_visited = array_append(daily_tabs_visited, 'view_entregadores')
        WHERE user_id = v_user_id AND NOT ('view_entregadores' = ANY(daily_tabs_visited));
    ELSIF p_interaction_type = 'view_evolucao' THEN
        UPDATE public.gamification_user_stats 
        SET view_count_evolucao = COALESCE(view_count_evolucao, 0) + 1,
            daily_tabs_visited = array_append(daily_tabs_visited, 'view_evolucao')
        WHERE user_id = v_user_id AND NOT ('view_evolucao' = ANY(daily_tabs_visited));
    ELSIF p_interaction_type = 'filter_change' THEN
        UPDATE public.gamification_user_stats SET filter_usage_count = COALESCE(filter_usage_count, 0) + 1 WHERE user_id = v_user_id;
    END IF;

    -- Recarregar stats atualizados
    SELECT * INTO v_user_stats FROM public.gamification_user_stats WHERE user_id = v_user_id;

    -- Verificar Conquistas Desbloqueáveis
    FOR v_badge IN 
        SELECT * FROM public.gamification_badges b
        WHERE b.slug NOT IN (SELECT badge_slug FROM public.gamification_user_badges WHERE user_id = v_user_id)
    LOOP
        -- Checar critérios expandidos
        -- 1. Maratonista (Duration > 2 hours)
        IF v_badge.slug = 'marathon' OR v_badge.slug = 'maratonista' THEN
             v_session_duration := v_user_stats.last_interaction_at - v_user_stats.session_start_at;
             IF EXTRACT(EPOCH FROM v_session_duration) >= 7200 THEN -- 7200 seconds = 2 hours
                 INSERT INTO public.gamification_user_badges (user_id, badge_slug) VALUES (v_user_id, v_badge.slug);
                 new_badge_slug := v_badge.slug; new_badge_name := v_badge.name; new_badge_description := v_badge.description; new_badge_icon := v_badge.icon; RETURN NEXT;
             END IF;
        
        -- 2. Coruja Noturna (22h - 05h)
        ELSIF v_badge.slug = 'night_owl' OR v_badge.slug = 'coruja_noturna' THEN
             v_hour := EXTRACT(HOUR FROM v_now AT TIME ZONE 'America/Sao_Paulo'); -- Adjust timezone if needed
             IF v_hour >= 22 OR v_hour < 5 THEN
                 INSERT INTO public.gamification_user_badges (user_id, badge_slug) VALUES (v_user_id, v_badge.slug);
                 new_badge_slug := v_badge.slug; new_badge_name := v_badge.name; new_badge_description := v_badge.description; new_badge_icon := v_badge.icon; RETURN NEXT;
             END IF;

        -- 3. Analista Pro (All tabs in one day)
        ELSIF v_badge.slug = 'analyst_pro' OR v_badge.slug = 'analista_pro' THEN
             -- Check if all 4 main tabs have been visited today
             IF 'view_comparacao' = ANY(v_user_stats.daily_tabs_visited) AND
                'view_resumo' = ANY(v_user_stats.daily_tabs_visited) AND
                'view_entregadores' = ANY(v_user_stats.daily_tabs_visited) AND
                'view_evolucao' = ANY(v_user_stats.daily_tabs_visited) 
             THEN
                 INSERT INTO public.gamification_user_badges (user_id, badge_slug) VALUES (v_user_id, v_badge.slug);
                 new_badge_slug := v_badge.slug; new_badge_name := v_badge.name; new_badge_description := v_badge.description; new_badge_icon := v_badge.icon; RETURN NEXT;
             END IF;

        -- Existing Logic (Counters)
        ELSIF (v_badge.criteria_type = 'login_streak' AND v_user_stats.login_streak >= v_badge.threshold) OR
           (v_badge.criteria_type = 'view_count_comparacao' AND v_user_stats.view_count_comparacao >= v_badge.threshold) OR
           (v_badge.criteria_type = 'view_count_resumo' AND v_user_stats.view_count_resumo >= v_badge.threshold) OR
           (v_badge.criteria_type = 'view_count_entregadores' AND v_user_stats.view_count_entregadores >= v_badge.threshold) OR
           (v_badge.criteria_type = 'view_count_evolucao' AND v_user_stats.view_count_evolucao >= v_badge.threshold) OR
           (v_badge.criteria_type = 'filter_usage_count' AND v_user_stats.filter_usage_count >= v_badge.threshold)
        THEN
            INSERT INTO public.gamification_user_badges (user_id, badge_slug) VALUES (v_user_id, v_badge.slug);
            new_badge_slug := v_badge.slug;
            new_badge_name := v_badge.name;
            new_badge_description := v_badge.description;
            new_badge_icon := v_badge.icon;
            RETURN NEXT;
        END IF;
    END LOOP;

    RETURN;
END;
$function$;
