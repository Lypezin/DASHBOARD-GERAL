-- =====================================================
-- FORÇAR CONQUISTA "PRIMEIRO ACESSO"
-- Execute este SQL para desbloquear a conquista manualmente
-- =====================================================

-- Inserir conquista "Primeiro Acesso" para o usuário atual
INSERT INTO public.user_conquistas (user_id, conquista_id, progresso, visualizada)
SELECT 
  auth.uid(),
  c.id,
  100,
  false
FROM public.conquistas c
WHERE c.codigo = 'primeiro_acesso'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_conquistas uc
    WHERE uc.user_id = auth.uid() AND uc.conquista_id = c.id
  );

-- Verificar se foi criada
SELECT 
  'Conquista "Primeiro Acesso" desbloqueada!' as status,
  c.nome,
  c.icone,
  uc.conquistada_em
FROM public.user_conquistas uc
JOIN public.conquistas c ON c.id = uc.conquista_id
WHERE uc.user_id = auth.uid() AND c.codigo = 'primeiro_acesso';

-- Testar função de verificação
SELECT * FROM verificar_conquistas();

