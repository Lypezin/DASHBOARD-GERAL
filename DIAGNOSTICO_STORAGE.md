# Diagnóstico do Problema de Upload de Avatar

## Problema Identificado

A URL do upload mostra `avatars/avatars/` quando deveria ser apenas `{user_id}/{filename}`.

## Possíveis Causas

1. **Aplicação não recompilada**: O código foi corrigido mas a aplicação ainda está usando a versão antiga
2. **Cache do navegador**: O navegador pode estar usando uma versão em cache do JavaScript
3. **Políticas do Storage não executadas**: As políticas RLS podem não estar configuradas corretamente

## Soluções

### 1. Recompilar a Aplicação

Se estiver rodando localmente:
```bash
npm run build
# ou se estiver em desenvolvimento:
npm run dev
```

Se estiver em produção (Vercel/outro):
- Faça um novo deploy ou aguarde o rebuild automático

### 2. Limpar Cache do Navegador

1. Abra o DevTools (F12)
2. Clique com botão direito no botão de recarregar
3. Selecione "Esvaziar cache e atualizar forçadamente" (ou "Empty Cache and Hard Reload")
4. Ou use Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac)

### 3. Verificar Políticas do Storage

Execute o script `CONFIGURAR_STORAGE_AVATARS.sql` no Supabase SQL Editor para garantir que as políticas estão corretas.

### 4. Verificar Estrutura de Caminhos

Execute o script `TESTAR_STORAGE_UPLOAD.sql` para verificar se a estrutura de caminhos está correta.

## Verificação Rápida

1. Abra o DevTools (F12)
2. Vá na aba "Network"
3. Tente fazer upload novamente
4. Clique na requisição `POST` que falhou
5. Veja a aba "Payload" ou "Request" para ver o caminho exato sendo enviado

O caminho no `filePath` deve ser: `{user_id}/{timestamp}.{ext}` (sem o prefixo `avatars/`)

## Código Correto

O código em `src/app/perfil/page.tsx` linha 158 deve ser:

```typescript
const filePath = `${authUser.id}/${fileName}`;
```

**NÃO deve ser:**
```typescript
const filePath = `avatars/${authUser.id}/${fileName}`; // ❌ ERRADO
```

