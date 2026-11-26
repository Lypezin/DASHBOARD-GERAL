UPDATE public.dashboard_entregadores_rollout_state
SET enabled = true,
    shadow_enabled = false,
    latency_regression_streak = 0,
    last_rollback_reason = NULL,
    updated_at = now()
WHERE singleton = true;
