-- =====================================================================
-- VERIFICAR RLS E PERMISSÕES
-- =====================================================================

-- 1. Verificar se RLS está ativo na tabela dados_corridas
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_ativo,
  hasrls as tem_rls
FROM pg_tables 
WHERE tablename = 'dados_corridas';

-- 2. Verificar políticas RLS existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'dados_corridas';

-- 3. Verificar se a função tem SECURITY DEFINER
SELECT 
  proname as nome_funcao,
  prosecdef as security_definer,
  proowner,
  proacl as permissoes
FROM pg_proc 
WHERE proname = 'dashboard_resumo';

-- 4. Testar acesso direto aos dados (sem função)
SELECT 
  '4️⃣ TESTE: Acesso direto aos dados' as etapa,
  COUNT(*) as total_registros,
  SUM(numero_de_corridas_ofertadas) as total_ofertadas
FROM public.dados_corridas
WHERE praca = 'GUARULHOS'
LIMIT 1;

-- 5. Verificar se há dados com filtros específicos
SELECT 
  '5️⃣ VERIFICAÇÃO: Dados com filtros' as etapa,
  COUNT(*) as registros_encontrados,
  SUM(numero_de_corridas_ofertadas) as soma_ofertadas,
  array_agg(DISTINCT praca) as pracas_encontradas
FROM public.dados_corridas
WHERE data_do_periodo IS NOT NULL
  AND praca IS NOT NULL;

-- 6. Testar função com usuário atual
SELECT 
  '6️⃣ TESTE: Usuário atual' as etapa,
  current_user as usuario_atual,
  session_user as usuario_sessao;

-- 7. Verificar se há problema com campos NULL
SELECT 
  '7️⃣ VERIFICAÇÃO: Campos NULL' as etapa,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE data_do_periodo IS NULL) as sem_data,
  COUNT(*) FILTER (WHERE praca IS NULL) as sem_praca,
  COUNT(*) FILTER (WHERE numero_de_corridas_ofertadas IS NULL) as sem_ofertadas,
  COUNT(*) FILTER (WHERE numero_de_corridas_ofertadas = 0) as ofertadas_zero
FROM public.dados_corridas;
