-- =====================================================
-- SISTEMA DE CONQUISTAS
-- Tabelas e funções para gamificação do dashboard
-- =====================================================

-- Tabela de conquistas disponíveis
CREATE TABLE IF NOT EXISTS public.conquistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL, -- Código único da conquista
  nome VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  icone VARCHAR(10) NOT NULL, -- Emoji da conquista
  categoria VARCHAR(50) NOT NULL, -- 'dados', 'analise', 'frequencia', 'social'
  criterio_tipo VARCHAR(50) NOT NULL, -- 'contador', 'sequencia', 'meta'
  criterio_valor INTEGER NOT NULL, -- Valor necessário para conquistar
  pontos INTEGER DEFAULT 10, -- Pontos que a conquista vale
  raridade VARCHAR(20) DEFAULT 'comum', -- 'comum', 'rara', 'epica', 'lendaria'
  ordem INTEGER DEFAULT 0, -- Ordem de exibição
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de conquistas dos usuários
CREATE TABLE IF NOT EXISTS public.user_conquistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conquista_id UUID NOT NULL REFERENCES public.conquistas(id) ON DELETE CASCADE,
  conquistada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progresso INTEGER DEFAULT 0, -- Progresso atual (0-100%)
  visualizada BOOLEAN DEFAULT false, -- Se o usuário já viu a notificação
  UNIQUE(user_id, conquista_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_conquistas_user_id ON public.user_conquistas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_conquistas_visualizada ON public.user_conquistas(user_id, visualizada) WHERE NOT visualizada;
CREATE INDEX IF NOT EXISTS idx_conquistas_ativa ON public.conquistas(ativa) WHERE ativa;

-- RLS (Row Level Security)
ALTER TABLE public.conquistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_conquistas ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Conquistas são públicas para leitura" ON public.conquistas
  FOR SELECT USING (ativa = true);

CREATE POLICY "Usuários podem ver suas próprias conquistas" ON public.user_conquistas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode inserir conquistas de usuários" ON public.user_conquistas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar visualização de suas conquistas" ON public.user_conquistas
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- INSERIR CONQUISTAS INICIAIS
-- =====================================================

INSERT INTO public.conquistas (codigo, nome, descricao, icone, categoria, criterio_tipo, criterio_valor, pontos, raridade, ordem) VALUES
-- Conquistas de Frequência
('primeiro_acesso', 'Primeiro Passo', 'Acessou o dashboard pela primeira vez', '🎯', 'frequencia', 'contador', 1, 10, 'comum', 1),
('explorador', 'Explorador', 'Visitou todas as abas do dashboard', '🗺️', 'frequencia', 'contador', 8, 20, 'comum', 2),
('usuario_ativo', 'Usuário Ativo', 'Acessou o dashboard por 7 dias consecutivos', '🔥', 'frequencia', 'sequencia', 7, 50, 'rara', 3),
('maratonista', 'Maratonista', 'Acessou o dashboard por 30 dias consecutivos', '🏃', 'frequencia', 'sequencia', 30, 150, 'epica', 4),

-- Conquistas de Análise
('analista_iniciante', 'Analista Iniciante', 'Filtrou dados 10 vezes', '📊', 'analise', 'contador', 10, 15, 'comum', 5),
('analista_expert', 'Analista Expert', 'Filtrou dados 100 vezes', '📈', 'analise', 'contador', 100, 75, 'rara', 6),
('detetive_dados', 'Detetive de Dados', 'Usou a busca de entregadores 50 vezes', '🔍', 'analise', 'contador', 50, 50, 'rara', 7),
('comparador', 'Comparador', 'Usou a aba de comparação 5 vezes', '⚖️', 'analise', 'contador', 5, 30, 'comum', 8),

-- Conquistas de Performance
('eficiencia_total', 'Eficiência Total', 'Alcançou 95% de aderência', '⚡', 'dados', 'meta', 95, 100, 'epica', 9),
('mestre_utr', 'Mestre do UTR', 'Manteve UTR acima de 2.5', '🎖️', 'dados', 'meta', 250, 80, 'rara', 10),

-- Conquistas Especiais
('perfeccionista', 'Perfeccionista', 'Alcançou 100% de completude de corridas', '💎', 'dados', 'meta', 100, 200, 'lendaria', 11),
('velocista', 'Velocista', 'Carregou o dashboard em menos de 2 segundos', '⚡', 'frequencia', 'meta', 2, 25, 'comum', 12)
ON CONFLICT (codigo) DO NOTHING;

-- =====================================================
-- FUNÇÕES DO SISTEMA DE CONQUISTAS
-- =====================================================

-- Função para listar conquistas do usuário
CREATE OR REPLACE FUNCTION listar_conquistas_usuario()
RETURNS TABLE (
  conquista_id UUID,
  codigo VARCHAR,
  nome VARCHAR,
  descricao TEXT,
  icone VARCHAR,
  categoria VARCHAR,
  pontos INTEGER,
  raridade VARCHAR,
  conquistada BOOLEAN,
  conquistada_em TIMESTAMP WITH TIME ZONE,
  progresso INTEGER,
  visualizada BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS conquista_id,
    c.codigo,
    c.nome,
    c.descricao,
    c.icone,
    c.categoria,
    c.pontos,
    c.raridade,
    (uc.id IS NOT NULL) AS conquistada,
    uc.conquistada_em,
    COALESCE(uc.progresso, 0) AS progresso,
    COALESCE(uc.visualizada, false) AS visualizada
  FROM public.conquistas c
  LEFT JOIN public.user_conquistas uc ON uc.conquista_id = c.id AND uc.user_id = auth.uid()
  WHERE c.ativa = true
  ORDER BY c.ordem, c.created_at;
END;
$$;

-- Função para marcar conquista como visualizada
CREATE OR REPLACE FUNCTION marcar_conquista_visualizada(p_conquista_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_conquistas
  SET visualizada = true
  WHERE user_id = auth.uid() AND conquista_id = p_conquista_id;
  
  RETURN FOUND;
END;
$$;

-- Função para verificar e conceder conquistas
CREATE OR REPLACE FUNCTION verificar_conquistas()
RETURNS TABLE (
  conquista_nova BOOLEAN,
  conquista_codigo VARCHAR,
  conquista_nome VARCHAR,
  conquista_icone VARCHAR,
  conquista_pontos INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_total_acessos INTEGER;
  v_total_tabs_visitadas INTEGER;
  v_total_filtros INTEGER;
  v_total_buscas INTEGER;
  v_total_comparacoes INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  -- Contar estatísticas do usuário
  SELECT COUNT(*) INTO v_total_acessos
  FROM public.user_activity
  WHERE user_id = v_user_id AND action_type = 'page_load';
  
  SELECT COUNT(DISTINCT tab_name) INTO v_total_tabs_visitadas
  FROM public.user_activity
  WHERE user_id = v_user_id AND tab_name IS NOT NULL;
  
  SELECT COUNT(*) INTO v_total_filtros
  FROM public.user_activity
  WHERE user_id = v_user_id AND action_type = 'filter_change';
  
  SELECT COUNT(*) INTO v_total_buscas
  FROM public.user_activity
  WHERE user_id = v_user_id AND action_type = 'search';
  
  SELECT COUNT(*) INTO v_total_comparacoes
  FROM public.user_activity
  WHERE user_id = v_user_id AND tab_name = 'comparacao';
  
  -- Verificar conquista: Primeiro Acesso
  IF v_total_acessos >= 1 THEN
    INSERT INTO public.user_conquistas (user_id, conquista_id, progresso)
    SELECT v_user_id, id, 100
    FROM public.conquistas
    WHERE codigo = 'primeiro_acesso'
    ON CONFLICT (user_id, conquista_id) DO NOTHING;
  END IF;
  
  -- Verificar conquista: Explorador
  IF v_total_tabs_visitadas >= 8 THEN
    INSERT INTO public.user_conquistas (user_id, conquista_id, progresso)
    SELECT v_user_id, id, 100
    FROM public.conquistas
    WHERE codigo = 'explorador'
    ON CONFLICT (user_id, conquista_id) DO NOTHING;
  END IF;
  
  -- Verificar conquista: Analista Iniciante
  IF v_total_filtros >= 10 THEN
    INSERT INTO public.user_conquistas (user_id, conquista_id, progresso)
    SELECT v_user_id, id, 100
    FROM public.conquistas
    WHERE codigo = 'analista_iniciante'
    ON CONFLICT (user_id, conquista_id) DO NOTHING;
  END IF;
  
  -- Verificar conquista: Analista Expert
  IF v_total_filtros >= 100 THEN
    INSERT INTO public.user_conquistas (user_id, conquista_id, progresso)
    SELECT v_user_id, id, 100
    FROM public.conquistas
    WHERE codigo = 'analista_expert'
    ON CONFLICT (user_id, conquista_id) DO NOTHING;
  END IF;
  
  -- Verificar conquista: Detetive de Dados
  IF v_total_buscas >= 50 THEN
    INSERT INTO public.user_conquistas (user_id, conquista_id, progresso)
    SELECT v_user_id, id, 100
    FROM public.conquistas
    WHERE codigo = 'detetive_dados'
    ON CONFLICT (user_id, conquista_id) DO NOTHING;
  END IF;
  
  -- Verificar conquista: Comparador
  IF v_total_comparacoes >= 5 THEN
    INSERT INTO public.user_conquistas (user_id, conquista_id, progresso)
    SELECT v_user_id, id, 100
    FROM public.conquistas
    WHERE codigo = 'comparador'
    ON CONFLICT (user_id, conquista_id) DO NOTHING;
  END IF;
  
  -- Retornar conquistas não visualizadas
  RETURN QUERY
  SELECT 
    true AS conquista_nova,
    c.codigo AS conquista_codigo,
    c.nome AS conquista_nome,
    c.icone AS conquista_icone,
    c.pontos AS conquista_pontos
  FROM public.user_conquistas uc
  JOIN public.conquistas c ON c.id = uc.conquista_id
  WHERE uc.user_id = v_user_id 
    AND NOT uc.visualizada
  ORDER BY uc.conquistada_em DESC;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION listar_conquistas_usuario() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION marcar_conquista_visualizada(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION verificar_conquistas() TO authenticated, anon;

-- Comentários
COMMENT ON TABLE public.conquistas IS 'Tabela de conquistas disponíveis no sistema';
COMMENT ON TABLE public.user_conquistas IS 'Tabela de conquistas conquistadas por usuários';
COMMENT ON FUNCTION listar_conquistas_usuario() IS 'Lista todas as conquistas e o progresso do usuário atual';
COMMENT ON FUNCTION marcar_conquista_visualizada(UUID) IS 'Marca uma conquista como visualizada pelo usuário';
COMMENT ON FUNCTION verificar_conquistas() IS 'Verifica e concede novas conquistas ao usuário baseado em suas atividades';

