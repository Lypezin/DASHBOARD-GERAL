# 🛡️ GUIA DE IMPLEMENTAÇÃO DE SEGURANÇA

Este guia explica como implementar as melhorias de segurança identificadas no relatório.

---

## ✅ MELHORIAS JÁ IMPLEMENTADAS

### 1. Rate Limiting ✅
- **Arquivo:** `src/lib/rateLimiter.ts`
- **Status:** Implementado
- **Funcionalidades:**
  - Rate limiter para RPC (30 req/min)
  - Rate limiter para uploads (5 req/5min)
  - Rate limiter para login (5 tentativas/15min)
  - Limpeza automática de registros expirados

### 2. Wrapper Seguro para RPC ✅
- **Arquivo:** `src/lib/rpcWrapper.ts`
- **Status:** Melhorado com rate limiting
- **Funcionalidades:**
  - Validação de parâmetros
  - Timeout de 30 segundos
  - Rate limiting integrado
  - Sanitização de erros

### 3. Validação de Uploads ✅
- **Arquivo:** `src/app/upload/page.tsx`
- **Status:** Melhorado
- **Funcionalidades:**
  - Rate limiting para uploads
  - Validação e sanitização de strings
  - Limite de tamanho de strings

---

## 🔧 PRÓXIMAS IMPLEMENTAÇÕES NECESSÁRIAS

### 1. Substituir Chamadas Diretas por `safeRpc()`

**Prioridade:** ALTA  
**Impacto:** Proteção contra SQL injection, timeout, validação

#### Arquivos que precisam ser atualizados:

1. **`src/hooks/useDashboardData.ts`**
   ```typescript
   // ANTES
   const { data, error } = await supabase.rpc('dashboard_resumo', filterPayload as any);
   
   // DEPOIS
   import { safeRpc } from '@/lib/rpcWrapper';
   const { data, error } = await safeRpc('dashboard_resumo', filterPayload, {
     timeout: 30000,
     validateParams: true
   });
   ```

2. **`src/hooks/useTabData.ts`**
   - Substituir todas as chamadas `supabase.rpc()` por `safeRpc()`

3. **`src/components/views/MonitoramentoView.tsx`**
   - Substituir 6 chamadas `supabase.rpc()` por `safeRpc()`

4. **`src/app/admin/page.tsx`**
   - Substituir 8 chamadas `supabase.rpc()` por `safeRpc()`

5. **Outros arquivos:**
   - `src/components/views/ComparacaoView.tsx` (3 chamadas)
   - `src/hooks/useConquistas.ts` (5 chamadas)
   - `src/app/perfil/page.tsx` (4 chamadas)
   - E mais 10 arquivos...

#### Script de busca e substituição:

```bash
# Encontrar todas as chamadas
grep -r "supabase\.rpc(" src/ --include="*.ts" --include="*.tsx"
```

---

### 2. Habilitar RLS no Banco de Dados

**Prioridade:** CRÍTICA  
**Impacto:** Proteção de dados sensíveis

#### Executar no Supabase SQL Editor:

```sql
-- 1. Habilitar RLS na tabela principal
ALTER TABLE public.dados_corridas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dados_corridas FORCE ROW LEVEL SECURITY;

-- 2. Verificar políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'dados_corridas';

-- 3. Habilitar RLS na tabela de backups
ALTER TABLE public.backup_otimizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_otimizacao FORCE ROW LEVEL SECURITY;

-- 4. Criar política para backups (apenas admins)
DROP POLICY IF EXISTS "Only admins can access backup_otimizacao" ON public.backup_otimizacao;
CREATE POLICY "Only admins can access backup_otimizacao"
ON public.backup_otimizacao
FOR ALL
USING (
  (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) = true
)
WITH CHECK (
  (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) = true
);
```

---

### 3. Adicionar `SET search_path` em Funções RPC

**Prioridade:** ALTA  
**Impacto:** Proteção contra SQL injection via schema

#### Exemplo de correção:

```sql
-- ANTES (vulnerável)
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(is_admin boolean, assigned_pracas text[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- código
END;
$$;

-- DEPOIS (seguro)
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(is_admin boolean, assigned_pracas text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth  -- ADICIONAR ESTA LINHA
AS $$
BEGIN
  -- código
END;
$$;
```

#### Funções que precisam ser corrigidas:

1. `get_current_user_profile`
2. `list_pracas_disponiveis`
3. `approve_user`
4. `update_user_pracas`
5. `set_user_admin`
6. `pesquisar_entregadores`
7. E mais 19 funções...

**Script para encontrar funções sem search_path:**

```sql
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true  -- SECURITY DEFINER
  AND pg_get_functiondef(p.oid) NOT LIKE '%SET search_path%';
```

---

### 4. Configurar Rate Limiting no Supabase

**Prioridade:** MÉDIA  
**Impacto:** Proteção contra DDoS no servidor

#### Passos:

1. Acessar Dashboard Supabase
2. Ir em **Settings** → **API**
3. Configurar **Rate Limiting**:
   - Limite de requisições por minuto: 100
   - Limite de requisições por hora: 1000
   - Limite de requisições por dia: 10000

#### Ou via SQL (se disponível):

```sql
-- Verificar configurações atuais
SELECT * FROM pg_settings WHERE name LIKE '%rate%';
```

**Nota:** Rate limiting no Supabase pode variar conforme o plano. Verificar documentação atual.

---

### 5. Melhorar Validação de Uploads

**Prioridade:** MÉDIA  
**Impacto:** Prevenir upload de arquivos maliciosos

#### Melhorias já implementadas:
- ✅ Rate limiting
- ✅ Validação de tamanho
- ✅ Validação de extensão
- ✅ Validação de MIME type
- ✅ Sanitização de strings

#### Melhorias adicionais recomendadas:

1. **Validar conteúdo real do arquivo:**
   ```typescript
   // Verificar se o arquivo é realmente um Excel válido
   try {
     const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
     if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
       throw new Error('Arquivo Excel inválido ou vazio');
     }
   } catch (error) {
     throw new Error('Arquivo não é um Excel válido');
   }
   ```

2. **Limitar número de linhas:**
   ```typescript
   const MAX_ROWS = 100000;
   if (rawData.length > MAX_ROWS) {
     throw new Error(`Arquivo muito grande. Máximo de ${MAX_ROWS} linhas permitidas.`);
   }
   ```

3. **Validar estrutura das colunas:**
   ```typescript
   const requiredColumns = Object.keys(COLUMN_MAP);
   const fileColumns = Object.keys(rawData[0] || {});
   const missingColumns = requiredColumns.filter(col => !fileColumns.includes(col));
   if (missingColumns.length > 0) {
     throw new Error(`Colunas obrigatórias faltando: ${missingColumns.join(', ')}`);
   }
   ```

---

### 6. Implementar Logging de Segurança

**Prioridade:** BAIXA  
**Impacto:** Monitoramento e detecção de ataques

#### Exemplo de implementação:

```typescript
// src/lib/securityLogger.ts
import { safeLog } from './errorHandler';

export function logSecurityEvent(
  event: 'login_failed' | 'unauthorized_access' | 'rate_limit_exceeded' | 'suspicious_activity',
  details: Record<string, any>
) {
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    user: details.user || 'anonymous',
    ip: details.ip || 'unknown',
    ...details,
  };

  // Em produção, enviar para serviço de logging (ex: Sentry, LogRocket)
  safeLog.warn('Security Event:', logData);

  // Em desenvolvimento, apenas logar
  if (process.env.NODE_ENV === 'development') {
    console.warn('🔒 Security Event:', logData);
  }
}
```

#### Uso:

```typescript
import { logSecurityEvent } from '@/lib/securityLogger';

// Em caso de login falhado
logSecurityEvent('login_failed', {
  email: email,
  reason: 'invalid_credentials',
});

// Em caso de acesso não autorizado
logSecurityEvent('unauthorized_access', {
  path: '/admin',
  user: currentUser?.id,
});

// Em caso de rate limit excedido
logSecurityEvent('rate_limit_exceeded', {
  function: 'dashboard_resumo',
  user: currentUser?.id,
});
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Crítico (Fazer Imediatamente)
- [x] Criar rate limiter
- [x] Integrar rate limiting no rpcWrapper
- [x] Melhorar validação de uploads
- [ ] Habilitar RLS no banco de dados
- [ ] Adicionar `SET search_path` em funções RPC

### Fase 2: Alto (Fazer em Breve)
- [ ] Substituir chamadas `supabase.rpc()` por `safeRpc()` em arquivos críticos
- [ ] Configurar rate limiting no Supabase
- [ ] Melhorar validação de uploads (conteúdo real)

### Fase 3: Médio (Fazer quando possível)
- [ ] Substituir todas as chamadas `supabase.rpc()` por `safeRpc()`
- [ ] Implementar logging de segurança
- [ ] Adicionar CSRF tokens

### Fase 4: Baixo (Melhorias futuras)
- [ ] Implementar 2FA
- [ ] Adicionar CAPTCHA
- [ ] Configurar WAF

---

## 🧪 TESTES DE SEGURANÇA

### Teste 1: Rate Limiting
```typescript
// Fazer 31 requisições rapidamente
for (let i = 0; i < 31; i++) {
  await safeRpc('dashboard_resumo', {});
}
// A 31ª deve retornar erro de rate limit
```

### Teste 2: Validação de Parâmetros
```typescript
// Tentar passar parâmetros inválidos
await safeRpc('dashboard_resumo', {
  p_ano: 'invalid',
  p_semana: 999,
});
// Deve retornar erro de validação
```

### Teste 3: Timeout
```typescript
// Simular requisição lenta (se possível)
// Deve retornar erro de timeout após 30s
```

### Teste 4: SQL Injection
```typescript
// Tentar SQL injection via parâmetros
await safeRpc('dashboard_resumo', {
  p_praca: "'; DROP TABLE dados_corridas; --",
});
// Deve ser sanitizado e não executar SQL malicioso
```

---

## 📚 RECURSOS ADICIONAIS

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/auth/security)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

---

**Última atualização:** $(date)

