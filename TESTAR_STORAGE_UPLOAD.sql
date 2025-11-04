-- =====================================================================
-- TESTE DAS POLÍTICAS DE STORAGE
-- =====================================================================
-- Este script verifica se as políticas estão corretas e testa
-- a estrutura de caminhos esperada
-- =====================================================================

-- 1. Verificar políticas existentes
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN qual::text
    ELSE 'NULL'
  END as qual,
  CASE 
    WHEN with_check IS NOT NULL THEN with_check::text
    ELSE 'NULL'
  END as with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%Avatar%'
ORDER BY cmd;

-- 2. Verificar estrutura de pastas esperada
-- Quando o caminho é {user_id}/{filename}, o foldername(name)[1] deve retornar {user_id}
-- Exemplo de teste:
SELECT 
  'Teste de estrutura de caminho' as descricao,
  'Caminho: 8eefcb0c-9b28-4ca1-8e8d-4e1bd0e5f96f/1762271991257.jpg' as caminho_exemplo,
  (string_to_array('8eefcb0c-9b28-4ca1-8e8d-4e1bd0e5f96f/1762271991257.jpg', '/'))[1] as primeiro_elemento,
  'Deve ser o user_id' as esperado;

-- 3. Verificar se o bucket existe e está configurado corretamente
SELECT 
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'avatars';

-- =====================================================================
-- NOTA IMPORTANTE:
-- =====================================================================
-- Se o caminho no storage for "avatars/{user_id}/{filename}" (com o prefixo avatars),
-- então a política precisa ser ajustada para usar foldername(name)[2] em vez de [1].
-- 
-- Mas o correto é que o caminho seja apenas "{user_id}/{filename}" quando usamos
-- .from('avatars'), então foldername(name)[1] deve retornar o user_id.
-- =====================================================================

