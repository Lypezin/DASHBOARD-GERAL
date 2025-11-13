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
  // Ler variáveis novamente em runtime (podem ter sido definidas após o import)
  // No Next.js, variáveis NEXT_PUBLIC_ são injetadas no build e disponíveis em runtime
  const runtimeUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const runtimeKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Se temos variáveis válidas e o cliente atual é mock, recriar
  if (supabaseInstance && runtimeUrl && runtimeKey && 
      runtimeUrl !== 'https://placeholder.supabase.co' &&
      runtimeUrl.includes('.supabase.co')) {
    // Verificar se o cliente atual é mock (comparando URL)
    const currentUrl = (supabaseInstance as any).supabaseUrl;
    if (currentUrl === 'https://placeholder.supabase.co') {
      // Forçar recriação com variáveis reais
      supabaseInstance = null;
    }
  }

  // Se já existe uma instância válida (não mock), retornar
  if (supabaseInstance) {
    const currentUrl = (supabaseInstance as any).supabaseUrl;
    if (currentUrl && currentUrl !== 'https://placeholder.supabase.co') {
      return supabaseInstance;
    }
  }

  // Durante o build, criar um cliente mock para evitar erros
  if (isBuildTime && (!runtimeUrl || !runtimeKey)) {
    const dummyUrl = 'https://placeholder.supabase.co';
    const dummyKey = 'dummy-key';
    
    supabaseInstance = createClient(dummyUrl, dummyKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      }
    });
    
    return supabaseInstance;
  }

  // Em runtime, verificar se as variáveis estão disponíveis
  if (!runtimeUrl || !runtimeKey) {
    // Se estamos em runtime e não temos variáveis, mas temos um mock, usar o mock temporariamente
    // Mas logar um aviso
    if (supabaseInstance && typeof window !== 'undefined') {
      console.warn(
        '[Supabase Client] Variáveis de ambiente não encontradas em runtime. ' +
        'Usando cliente mock. Verifique se NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
        'estão configuradas no Vercel e faça um novo deploy.'
      );
      return supabaseInstance;
    }
    
    // Se não temos nem mock nem variáveis, lançar erro
    throw new Error(
      'As variáveis de ambiente do Supabase não estão configuradas corretamente. ' +
      'Verifique se NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão configuradas no Vercel. ' +
      'Após configurar, faça um novo deploy.'
    );
  }

  // Criar cliente real com as variáveis de ambiente disponíveis
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

// Exportar uma função getter que cria o cliente sob demanda
// Isso evita erros durante o build
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    
    // Se for uma função, garantir que o contexto 'this' seja correto
    if (typeof value === 'function') {
      return value.bind(client);
    }
    
    return value;
  }
});
