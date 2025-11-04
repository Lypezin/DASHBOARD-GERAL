# Guia de Configuração do Storage para Fotos de Perfil

Este guia explica passo a passo como configurar o Supabase Storage para permitir upload de fotos de perfil.

## 📋 Passo 1: Criar o Bucket "avatars"

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Storage** → **Buckets**
4. Clique em **"New bucket"**
5. Configure o bucket:
   - **Nome**: `avatars`
   - **Público**: ✅ **Sim** (marcar como público)
   - **File size limit**: `5` (MB)
   - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`
6. Clique em **"Create bucket"**

## 📋 Passo 2: Executar o Script SQL

Após criar o bucket, execute o arquivo `CONFIGURAR_STORAGE_AVATARS.sql` no SQL Editor do Supabase:

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **"New query"**
3. Cole o conteúdo do arquivo `CONFIGURAR_STORAGE_AVATARS.sql`
4. Clique em **"Run"** ou pressione `Ctrl+Enter`

## ✅ Verificação

Para verificar se as políticas foram criadas corretamente, execute esta query:

```sql
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%Avatar%';
```

Você deve ver 4 políticas:
- `Avatar public read` (SELECT)
- `Avatar authenticated insert` (INSERT)
- `Avatar authenticated update` (UPDATE)
- `Avatar authenticated delete` (DELETE)

## 🔒 Segurança

As políticas configuradas garantem que:

- ✅ **Qualquer pessoa pode ver** as fotos (público)
- ✅ **Apenas usuários autenticados** podem fazer upload
- ✅ **Usuários só podem gerenciar suas próprias fotos** (através da estrutura de pastas `avatars/{user_id}/`)

## 🐛 Solução de Problemas

### Erro: "Bucket not found"
- Certifique-se de que o bucket "avatars" foi criado
- Verifique se o nome está exatamente como "avatars" (minúsculas)

### Erro: "new row violates row-level security policy"
- Execute o script `CONFIGURAR_STORAGE_AVATARS.sql` novamente
- Verifique se as políticas foram criadas corretamente

### Foto não aparece após upload
- Verifique se o bucket está marcado como "Público"
- Verifique se a URL pública está correta no console do navegador
- Limpe o cache do navegador (Ctrl+Shift+R)

## 📝 Estrutura de Pastas

As fotos são armazenadas na seguinte estrutura:
```
avatars/
  └── {user_id}/
      └── {timestamp}.{ext}
```

Exemplo:
```
avatars/
  └── 123e4567-e89b-12d3-a456-426614174000/
      └── 1703123456789.jpg
```

Isso garante que cada usuário tenha sua própria pasta e não possa acessar fotos de outros usuários.

