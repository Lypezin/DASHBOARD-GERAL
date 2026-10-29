CREATE TABLE IF NOT EXISTS public.marketing_apresentacao_costs (
  period_type text NOT NULL CHECK (period_type IN ('day', 'week')),
  date_ref date NOT NULL,
  total_cost numeric(12, 2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (period_type, date_ref)
);

ALTER TABLE public.marketing_apresentacao_costs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.marketing_apresentacao_costs FROM anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.marketing_apresentacao_costs TO service_role;
