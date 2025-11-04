-- =====================================================================
-- CONFIGURAÇÃO COMPLETA DO STORAGE PARA AVATARS
-- =====================================================================
-- Este script configura todas as políticas necessárias para o bucket "avatars"
-- Execute este script APÓS criar o bucket "avatars" no Supabase Storage
-- =====================================================================

-- IMPORTANTE: Primeiro, certifique-se de que o bucket "avatars" foi criado
-- no Supabase Dashboard (Storage → Buckets → New bucket)
-- Nome: "avatars"
-- Público: Sim
-- File size limit: 5MB (ou o tamanho que preferir)
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- =====================================================================
-- 1. REMOVER POLÍTICAS EXISTENTES (se houver)
-- =====================================================================

-- Remover políticas antigas do bucket "avatars" se existirem
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated delete" ON storage.objects;

-- =====================================================================
-- 2. POLÍTICA PARA SELECT (LEITURA PÚBLICA)
-- =====================================================================
-- Permite que qualquer pessoa possa ver as fotos de perfil (público)
CREATE POLICY "Avatar public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- =====================================================================
-- 3. POLÍTICA PARA INSERT (UPLOAD - APENAS AUTENTICADOS)
-- =====================================================================
-- Permite que usuários autenticados façam upload de suas próprias fotos
-- IMPORTANTE: O caminho deve ser {user_id}/{filename} (sem prefixo avatars/)
-- Quando usamos .from('avatars'), o Supabase já adiciona o bucket ao caminho
-- A função storage.foldername(name)[1] retorna o primeiro elemento do caminho
-- Se o caminho for "user_id/filename", então [1] = user_id
CREATE POLICY "Avatar authenticated insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (
    -- Verificar se o primeiro elemento do caminho é o user_id
    (storage.foldername(name))[1] = auth.uid()::text
    -- OU se o caminho começa com avatars/ (caso o código antigo ainda esteja em cache)
    OR (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- =====================================================================
-- 4. POLÍTICA PARA UPDATE (ATUALIZAR - APENAS AUTENTICADOS)
-- =====================================================================
-- Permite que usuários autenticados atualizem apenas suas próprias fotos
-- IMPORTANTE: Suporta ambos os formatos de caminho (com e sem prefixo avatars/)
CREATE POLICY "Avatar authenticated update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (storage.foldername(name))[2] = auth.uid()::text
  )
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- =====================================================================
-- 5. POLÍTICA PARA DELETE (REMOVER - APENAS AUTENTICADOS)
-- =====================================================================
-- Permite que usuários autenticados removam apenas suas próprias fotos
-- IMPORTANTE: Suporta ambos os formatos de caminho (com e sem prefixo avatars/)
CREATE POLICY "Avatar authenticated delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- =====================================================================
-- VERIFICAÇÃO FINAL
-- =====================================================================
-- Execute esta query para verificar se as políticas foram criadas:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%Avatar%';

-- =====================================================================
-- NOTAS IMPORTANTES:
-- =====================================================================
-- 1. As políticas usam a estrutura de pastas: avatars/{user_id}/{filename}
-- 2. A função storage.foldername(name)[1] extrai o primeiro nível da pasta (user_id)
-- 3. Isso garante que cada usuário só pode gerenciar suas próprias fotos
-- 4. O bucket deve ser criado como "Público" para permitir leitura pública
-- 5. O tamanho máximo do arquivo pode ser configurado no bucket (recomendado: 5MB)
-- =====================================================================

