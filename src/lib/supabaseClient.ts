import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Ler variáveis de ambiente - podem estar disponíveis em diferentes momentos
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verificar se estamos em build time
// Durante o build do Next.js, algumas variáveis podem não estar disponíveis
// Mas em runtime (especialmente no Vercel), elas devem estar disponíveis
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    process.env.NEXT_PHASE === 'phase-development-build';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  // Ler variáveis novamente em runtime
  // No Next.js, variáveis NEXT_PUBLIC_ são injetadas no build e disponíveis em runtime
  const runtimeUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const runtimeKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Log detalhado para debug (apenas em desenvolvimento ou quando há problemas)
  if (typeof window !== 'undefined' && (process.env.NODE_ENV === 'development' || !runtimeUrl || runtimeUrl.includes('placeholder'))) {
    const { safeLog } = require('@/lib/errorHandler');
    safeLog.info('[Supabase Client] Verificando variáveis:', {
      hasUrl: !!runtimeUrl,
      hasKey: !!runtimeKey,
      url: runtimeUrl?.substring(0, 30) + '...',
      keyLength: runtimeKey?.length || 0,
      isPlaceholder: runtimeUrl?.includes('placeholder')
    });
  }

  // Verificar se temos variáveis válidas
  const hasValidVars = runtimeUrl && runtimeKey && 
                       runtimeUrl !== 'https://placeholder.supabase.co' &&
                       runtimeUrl.includes('.supabase.co') &&
                       runtimeKey.length > 20; // Chave válida tem mais de 20 caracteres

  // Se temos variáveis válidas, verificar se precisamos recriar o cliente
  if (hasValidVars) {
    // Se não temos instância ou a instância atual é mock, criar nova
    if (!supabaseInstance) {
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        const { safeLog } = require('@/lib/errorHandler');
        safeLog.info('[Supabase Client] Criando nova instância com variáveis válidas');
      }
      supabaseInstance = createClient(runtimeUrl, runtimeKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          storageKey: 'supabase.auth.token',
          flowType: 'pkce'
        }
      });
      return supabaseInstance;
    }
    
    // Verificar se a instância atual é mock
    const currentUrl = (supabaseInstance as any).supabaseUrl;
    if (currentUrl === 'https://placeholder.supabase.co') {
      // Recriar com variáveis reais
      if (typeof window !== 'undefined') {
        const { safeLog } = require('@/lib/errorHandler');
        safeLog.warn('[Supabase Client] ⚠️ Instância mock detectada, recriando com variáveis reais...');
      }
      supabaseInstance = createClient(runtimeUrl, runtimeKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          storageKey: 'supabase.auth.token',
          flowType: 'pkce'
        }
      });
      if (typeof window !== 'undefined') {
        const { safeLog } = require('@/lib/errorHandler');
        safeLog.info('[Supabase Client] ✅ Cliente recriado com sucesso');
      }
      return supabaseInstance;
    }
    
    // Instância válida já existe
    return supabaseInstance;
  }

  // Durante o build, criar um cliente mock para evitar erros
  if (isBuildTime) {
    if (!supabaseInstance) {
      const dummyUrl = 'https://placeholder.supabase.co';
      const dummyKey = 'dummy-key';
      
      supabaseInstance = createClient(dummyUrl, dummyKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        }
      });
    }
    return supabaseInstance;
  }

  // Em runtime sem variáveis válidas
  // Se já temos um mock, usar temporariamente mas logar aviso
  if (supabaseInstance && typeof window !== 'undefined') {
    const currentUrl = (supabaseInstance as any).supabaseUrl;
    if (currentUrl === 'https://placeholder.supabase.co') {
      const { safeLog } = require('@/lib/errorHandler');
      safeLog.error(
        '[Supabase Client] ⚠️ Variáveis de ambiente não encontradas em runtime!\n' +
        'Verifique se NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão configuradas no Vercel.\n' +
        'Após configurar, faça um novo deploy (não apenas redeploy, mas um novo build).\n' +
        'Variáveis NEXT_PUBLIC_ são injetadas durante o build, não em runtime.'
      );
      return supabaseInstance; // Retornar mock temporariamente
    }
  }

  // Se não temos variáveis e não temos mock, lançar erro
  throw new Error(
    'As variáveis de ambiente do Supabase não estão configuradas corretamente. ' +
    'Verifique se NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão configuradas no Vercel. ' +
    'IMPORTANTE: Variáveis NEXT_PUBLIC_ são injetadas durante o BUILD. ' +
    'Após configurar as variáveis, você DEVE fazer um NOVO BUILD (não apenas redeploy).'
  );
}

// Função para forçar recriação do cliente (útil quando variáveis são configuradas após o build)
export function recreateSupabaseClient() {
  supabaseInstance = null;
  // Tentar criar novamente na próxima chamada
  return getSupabaseClient();
}

// Função auxiliar para criar um stub seguro do método rpc
// IMPORTANTE: Esta função deve ser serializável para não quebrar o prefetch do Next.js
function createSafeRpcStub() {
  const stub = function safeRpcStub(functionName: string, params?: any) {
    return Promise.resolve({ 
      data: null, 
      error: { 
        message: 'Cliente Supabase não está disponível. Aguarde o carregamento completo da página.', 
        code: 'CLIENT_NOT_READY' 
      } 
    });
  };
  // Garantir que a função tenha propriedades que o Next.js espera
  stub.call = stub.bind(stub);
  return stub;
}

// Exportar uma função getter que cria o cliente sob demanda
// Isso evita erros durante o build
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    // Se for a propriedade especial _recreate, forçar recriação
    if (prop === '_recreate') {
      return () => recreateSupabaseClient();
    }
    
    // Durante SSR/prefetch do Next.js, algumas propriedades podem não estar disponíveis
    // Retornar um objeto seguro que não quebra o prefetch
    try {
      const client = getSupabaseClient();
      
      // Se o cliente não foi criado corretamente, retornar um stub seguro
      if (!client) {
        // Retornar um stub que não quebra durante prefetch
        if (prop === 'rpc') {
          return createSafeRpcStub();
        }
        // Retornar um objeto vazio para outras propriedades durante prefetch
        if (prop === 'auth') {
          return {}; // Stub vazio para auth
        }
        return undefined;
      }
      
      const value = (client as any)[prop];
      
      // Se a propriedade não existe, retornar undefined em vez de quebrar
      if (value === undefined) {
        // Para rpc, retornar um stub seguro em vez de undefined
        if (prop === 'rpc') {
          return createSafeRpcStub();
        }
        return undefined;
      }
      
      // Se for uma função, garantir que o contexto 'this' seja correto
      if (typeof value === 'function') {
        // Verificar se é o método rpc e garantir que está disponível
        if (prop === 'rpc') {
          try {
            // Testar se o método rpc está realmente disponível
            const testCall = value.bind(client);
            if (typeof testCall === 'function') {
              return testCall;
            }
          } catch (e) {
            // Se falhar, retornar stub seguro
            return createSafeRpcStub();
          }
        }
        return value.bind(client);
      }
      
      return value;
    } catch (error) {
      // Durante prefetch/SSR, pode haver erros ao criar o cliente
      // Retornar stubs seguros que não quebram o prefetch
      if (prop === 'rpc') {
        return createSafeRpcStub();
      }
      if (prop === 'auth') {
        return {}; // Stub vazio para auth
      }
      // Para outras propriedades, retornar undefined
      return undefined;
    }
  }
});
