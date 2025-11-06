# 🔒 Auditoria de Segurança - Dashboard Geral

**Data da Auditoria:** $(date)  
**Versão Analisada:** Atual  
**Escopo:** Frontend (Next.js) + Backend (Supabase)

---

## 📋 Sumário Executivo

Esta auditoria identificou **15 pontos de melhoria** em segurança, categorizados por nível de criticidade:
- 🔴 **Crítico:** 3 problemas
- 🟡 **Alto:** 5 problemas  
- 🟢 **Médio:** 4 problemas
- 🔵 **Baixo:** 3 melhorias

---

## 🔴 PROBLEMAS CRÍTICOS

### 1. **Falta de Validação de Entrada em Funções RPC**

**Localização:** `src/app/page.tsx` (múltiplas chamadas `.rpc()`)

**Problema:**
Os parâmetros passados para funções RPC não são validados antes do envio. Isso pode permitir:
- Injeção de valores maliciosos
- Overflow de dados
- Ataques de DoS através de queries pesadas

**Exemplo Problemático:**
```typescript
// src/app/page.tsx:2638
const { data, error } = await supabase.rpc('dashboard_resumo', filtro);
// 'filtro' pode conter valores não validados
```

**Recomendação:**
```typescript
// Criar função de validação
function validateFilterPayload(payload: any): any {
  const validated: any = {};
  
  if (payload.p_ano) {
    const ano = parseInt(payload.p_ano, 10);
    if (isNaN(ano) || ano < 2000 || ano > 2100) {
      throw new Error('Ano inválido');
    }
    validated.p_ano = ano;
  }
  
  if (payload.p_semana) {
    const semana = parseInt(payload.p_semana, 10);
    if (isNaN(semana) || semana < 1 || semana > 53) {
      throw new Error('Semana inválida');
    }
    validated.p_semana = semana;
  }
  
  if (payload.p_praca) {
    // Validar formato (apenas letras, números, espaços e caracteres especiais permitidos)
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(payload.p_praca)) {
      throw new Error('Praça contém caracteres inválidos');
    }
    validated.p_praca = payload.p_praca.substring(0, 100); // Limitar tamanho
  }
  
  // Validar arrays
  if (payload.p_sub_praca && Array.isArray(payload.p_sub_praca)) {
    validated.p_sub_praca = payload.p_sub_praca
      .filter((s: string) => /^[a-zA-Z0-9\s\-_]+$/.test(s))
      .slice(0, 50) // Limitar quantidade
      .map((s: string) => s.substring(0, 100));
  }
  
  return validated;
}

// Usar antes de chamar RPC
const validatedFilter = validateFilterPayload(filtro);
const { data, error } = await supabase.rpc('dashboard_resumo', validatedFilter);
```

**Prioridade:** 🔴 CRÍTICA

---

### 2. **Falta de Rate Limiting**

**Localização:** Todas as páginas que fazem chamadas RPC

**Problema:**
Não há proteção contra:
- Ataques de força bruta
- Abuso de API (múltiplas requisições simultâneas)
- DoS através de requisições excessivas

**Recomendação:**
```typescript
// src/lib/rateLimiter.ts
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(identifier: string): Promise<boolean> {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Remover requisições antigas
    const recentRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    return true;
  }
}

// Usar no componente
const rateLimiter = new RateLimiter(10, 60000); // 10 requisições por minuto

async function fetchData() {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return;
  
  if (!await rateLimiter.checkLimit(userId)) {
    throw new Error('Muitas requisições. Aguarde um momento.');
  }
  
  // Fazer requisição...
}
```

**Alternativa:** Implementar rate limiting no Supabase usando Edge Functions ou políticas RLS.

**Prioridade:** 🔴 CRÍTICA

---

### 3. **Exposição de Informações Sensíveis em Logs**

**Localização:** Múltiplos arquivos com `IS_DEV` e `console.log`

**Problema:**
Logs em desenvolvimento podem expor:
- Estrutura de dados
- IDs de usuários
- Informações de sessão
- Estrutura de queries

**Exemplo Problemático:**
```typescript
// src/app/page.tsx:2022
if (IS_DEV && data.length > 0) {
  console.log(`✅ ${data.length} usuário(s) online encontrado(s)`);
}
```

**Recomendação:**
```typescript
// Criar utilitário de logging seguro
// src/lib/logger.ts
const IS_DEV = process.env.NODE_ENV === 'development';
const IS_PROD = process.env.NODE_ENV === 'production';

export const logger = {
  info: (message: string, data?: any) => {
    if (IS_DEV) {
      console.log(message, data ? sanitizeLogData(data) : '');
    }
  },
  error: (message: string, error?: any) => {
    if (IS_DEV) {
      console.error(message, error ? sanitizeError(error) : '');
    } else {
      // Em produção, enviar para serviço de logging (Sentry, LogRocket, etc.)
      // Não logar dados sensíveis
    }
  },
  warn: (message: string, data?: any) => {
    if (IS_DEV) {
      console.warn(message, data ? sanitizeLogData(data) : '');
    }
  }
};

function sanitizeLogData(data: any): any {
  if (!data) return data;
  
  if (typeof data === 'object') {
    const sanitized = { ...data };
    // Remover campos sensíveis
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    delete sanitized.api_key;
    // Limitar tamanho de arrays
    if (Array.isArray(sanitized)) {
      return sanitized.slice(0, 10).map(sanitizeLogData);
    }
    return sanitized;
  }
  
  return data;
}

function sanitizeError(error: any): any {
  if (!error) return error;
  
  return {
    message: error.message,
    code: error.code,
    // Não incluir stack trace em produção
    stack: IS_DEV ? error.stack : undefined
  };
}
```

**Prioridade:** 🔴 CRÍTICA

---

## 🟡 PROBLEMAS DE ALTA PRIORIDADE

### 4. **Falta de Validação de Tipo de Arquivo no Upload**

**Localização:** `src/app/upload/page.tsx:75-219`

**Problema:**
O código processa arquivos Excel sem validar adequadamente:
- Tipo MIME real (não apenas extensão)
- Tamanho máximo antes do processamento
- Estrutura interna do arquivo

**Código Atual:**
```typescript
// Não há validação de tipo MIME antes de processar
const arrayBuffer = await file.arrayBuffer();
const workbook = XLSX.read(arrayBuffer, { raw: true });
```

**Recomendação:**
```typescript
// Adicionar validação robusta
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/vnd.ms-excel.sheet.macroEnabled.12' // .xlsm
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const handleUpload = async () => {
  // Validar antes de processar
  for (const file of files) {
    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Arquivo ${file.name} excede o tamanho máximo de 50MB`);
    }
    
    // Validar tipo MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`Tipo de arquivo não permitido: ${file.type}`);
    }
    
    // Validar extensão
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'xlsm'].includes(extension || '')) {
      throw new Error(`Extensão não permitida: ${extension}`);
    }
    
    // Validar magic bytes (primeiros bytes do arquivo)
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer.slice(0, 8));
    const signature = Array.from(uint8Array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Assinaturas conhecidas de arquivos Excel
    const validSignatures = [
      '504b0304', // ZIP (XLSX)
      'd0cf11e0a1b11ae1', // OLE2 (XLS antigo)
    ];
    
    if (!validSignatures.some(sig => signature.startsWith(sig))) {
      throw new Error('Arquivo não é um Excel válido');
    }
    
    // Processar arquivo...
  }
};
```

**Prioridade:** 🟡 ALTA

---

### 5. **Falta de Headers de Segurança HTTP**

**Localização:** `next.config.mjs`

**Problema:**
Não há configuração de headers de segurança como:
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- Referrer-Policy

**Recomendação:**
```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'self'",
            ].join('; ')
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Prioridade:** 🟡 ALTA

---

### 6. **Falta de Sanitização de Dados do Usuário em Exibição**

**Localização:** `src/app/page.tsx` (exibição de dados de usuários)

**Problema:**
Dados do usuário são exibidos sem sanitização, permitindo potencial XSS se dados maliciosos forem inseridos no banco.

**Recomendação:**
```typescript
// src/lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Usar em componentes
<div>{sanitizeText(user.nome)}</div>
```

**Prioridade:** 🟡 ALTA

---

### 7. **Ausência de Middleware de Autenticação**

**Localização:** Raiz do projeto (não existe)

**Problema:**
A verificação de autenticação é feita apenas no lado do cliente, permitindo acesso direto a rotas protegidas.

**Recomendação:**
```typescript
// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Rotas protegidas
  const protectedRoutes = ['/', '/admin', '/upload', '/perfil'];
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(route + '/')
  );

  if (isProtectedRoute && !session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Rota de admin - verificar se é admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (session) {
      const { data: profile } = await supabase
        .rpc('get_current_user_profile')
        .single();
      
      if (!profile?.is_admin) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

**Prioridade:** 🟡 ALTA

---

### 8. **Falta de Validação de Sessão/Token Expiration**

**Localização:** `src/components/Header.tsx`, `src/app/page.tsx`

**Problema:**
Não há verificação periódica de expiração de token, permitindo que sessões expiradas continuem ativas.

**Recomendação:**
```typescript
// src/lib/auth.ts
export async function checkSessionValidity() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return false;
  }
  
  // Verificar se o token está próximo de expirar (5 minutos antes)
  const expiresAt = session.expires_at;
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = expiresAt - now;
  
  // Se faltar menos de 5 minutos, renovar
  if (timeUntilExpiry < 300) {
    const { data, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      return false;
    }
    return !!data.session;
  }
  
  return true;
}

// Usar em useEffect
useEffect(() => {
  const interval = setInterval(async () => {
    const isValid = await checkSessionValidity();
    if (!isValid) {
      await supabase.auth.signOut();
      router.push('/login');
    }
  }, 60000); // Verificar a cada minuto
  
  return () => clearInterval(interval);
}, []);
```

**Prioridade:** 🟡 ALTA

---

## 🟢 PROBLEMAS DE MÉDIA PRIORIDADE

### 9. **Falta de CSRF Protection**

**Localização:** Todas as páginas com formulários

**Problema:**
Não há proteção explícita contra CSRF (Cross-Site Request Forgery).

**Recomendação:**
```typescript
// Usar tokens CSRF do Supabase (já incluído, mas validar)
// Adicionar validação adicional em ações críticas
async function performCriticalAction(data: any) {
  // Gerar token CSRF
  const csrfToken = crypto.randomUUID();
  sessionStorage.setItem('csrf_token', csrfToken);
  
  // Incluir token na requisição
  const response = await supabase.rpc('action', {
    ...data,
    csrf_token: csrfToken
  });
  
  // Validar no backend (função RPC)
}
```

**Prioridade:** 🟢 MÉDIA

---

### 10. **Logs de Erro Expõem Estrutura Interna**

**Localização:** Múltiplos arquivos

**Problema:**
Mensagens de erro podem expor informações sobre a estrutura do sistema.

**Recomendação:**
```typescript
// Criar mapeamento de erros genéricos
const ERROR_MESSAGES = {
  '42883': 'Função não configurada. Entre em contato com o administrador.',
  '42P01': 'Recurso não disponível.',
  'PGRST116': 'Recurso não encontrado.',
  DEFAULT: 'Ocorreu um erro. Tente novamente mais tarde.'
};

function getSafeErrorMessage(error: any): string {
  if (IS_DEV) {
    return error.message || ERROR_MESSAGES.DEFAULT;
  }
  
  return ERROR_MESSAGES[error.code] || ERROR_MESSAGES.DEFAULT;
}
```

**Prioridade:** 🟢 MÉDIA

---

### 11. **Falta de Validação de Tamanho de Arrays em Filtros**

**Localização:** `src/app/page.tsx` (buildFilterPayload)

**Problema:**
Arrays de filtros podem crescer indefinidamente, causando queries pesadas.

**Recomendação:**
```typescript
function buildFilterPayload(filters: Filters) {
  const payload: any = {};
  
  // Limitar tamanho de arrays
  if (filters.subPracas && filters.subPracas.length > 0) {
    payload.p_sub_praca = filters.subPracas.slice(0, 50).join(',');
  }
  
  if (filters.origens && filters.origens.length > 0) {
    payload.p_origem = filters.origens.slice(0, 50).join(',');
  }
  
  if (filters.turnos && filters.turnos.length > 0) {
    payload.p_turno = filters.turnos.slice(0, 50).join(',');
  }
  
  // ... resto do código
}
```

**Prioridade:** 🟢 MÉDIA

---

### 12. **Falta de Timeout em Requisições**

**Localização:** Todas as chamadas RPC

**Problema:**
Requisições podem travar indefinidamente.

**Recomendação:**
```typescript
// src/lib/api.ts
export async function rpcWithTimeout<T>(
  rpcCall: Promise<{ data: T | null; error: any }>,
  timeoutMs: number = 30000
): Promise<{ data: T | null; error: any }> {
  return Promise.race([
    rpcCall,
    new Promise<{ data: null; error: any }>((resolve) => {
      setTimeout(() => {
        resolve({
          data: null,
          error: { message: 'Timeout: A requisição demorou muito para responder.' }
        });
      }, timeoutMs);
    })
  ]);
}

// Usar
const { data, error } = await rpcWithTimeout(
  supabase.rpc('dashboard_resumo', filtro),
  30000 // 30 segundos
);
```

**Prioridade:** 🟢 MÉDIA

---

## 🔵 MELHORIAS DE BAIXA PRIORIDADE

### 13. **Falta de Monitoramento de Segurança**

**Recomendação:**
- Implementar logging de ações críticas (login, upload, admin actions)
- Integrar com serviço de monitoramento (Sentry, LogRocket)
- Alertas para atividades suspeitas

**Prioridade:** 🔵 BAIXA

---

### 14. **Falta de Validação de CORS**

**Recomendação:**
Configurar CORS adequadamente no Supabase Dashboard:
- Permitir apenas domínios específicos
- Não usar `*` em produção

**Prioridade:** 🔵 BAIXA

---

### 15. **Falta de Backup e Recuperação de Dados**

**Recomendação:**
- Implementar backups automáticos do banco de dados
- Documentar processo de recuperação
- Testar restauração periodicamente

**Prioridade:** 🔵 BAIXA

---

## ✅ PONTOS POSITIVOS

1. ✅ **Uso de RPC Functions:** Reduz risco de SQL Injection
2. ✅ **Autenticação Supabase:** Sistema robusto de autenticação
3. ✅ **RLS (Row Level Security):** Configurado no banco (assumindo)
4. ✅ **Validação de Upload de Imagem:** Implementada em `perfil/page.tsx`
5. ✅ **Sem dangerouslySetInnerHTML:** Não encontrado uso inseguro
6. ✅ **Variáveis de Ambiente:** Credenciais não hardcoded

---

## 📝 PLANO DE AÇÃO RECOMENDADO

### Fase 1 (Crítico - 1 semana)
1. Implementar validação de entrada em RPC
2. Adicionar rate limiting
3. Sanitizar logs de desenvolvimento

### Fase 2 (Alto - 2 semanas)
4. Validar uploads de arquivo adequadamente
5. Adicionar headers de segurança
6. Implementar middleware de autenticação
7. Adicionar sanitização de dados exibidos
8. Validar expiração de sessão

### Fase 3 (Médio - 1 mês)
9. Proteção CSRF
10. Mensagens de erro genéricas
11. Validação de tamanho de arrays
12. Timeout em requisições

### Fase 4 (Baixo - Contínuo)
13. Monitoramento de segurança
14. Validação de CORS
15. Backup e recuperação

---

## 🔗 RECURSOS ADICIONAIS

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Supabase Security Guide](https://supabase.com/docs/guides/platform/security)

---

**Próximos Passos:**
1. Revisar este documento com a equipe
2. Priorizar itens críticos
3. Criar issues no sistema de controle de versão
4. Implementar melhorias gradualmente
5. Realizar nova auditoria após implementações

