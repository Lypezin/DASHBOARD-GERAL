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
  const runtimeUrl = typeof window !== 'undefined' 
    ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    : process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  const runtimeKey = typeof window !== 'undefined'
    ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const finalUrl = runtimeUrl || supabaseUrl;
  const finalKey = runtimeKey || supabaseAnonKey;

  // Se já existe uma instância válida, retornar
  if (supabaseInstance && finalUrl && finalKey && finalUrl !== 'https://placeholder.supabase.co') {
    return supabaseInstance;
  }

  // Durante o build, criar um cliente mock para evitar erros
  if (isBuildTime && (!finalUrl || !finalKey)) {
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
  if (!finalUrl || !finalKey) {
    // Log detalhado para debug (apenas em desenvolvimento)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('[Supabase Client] Variáveis de ambiente não encontradas:', {
        hasUrl: !!finalUrl,
        hasKey: !!finalKey,
        isBuildTime,
        isClient: typeof window !== 'undefined',
        envKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE')),
      });
    }
    
    throw new Error(
      'As variáveis de ambiente do Supabase não estão configuradas corretamente. ' +
      'Verifique se NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão configuradas no Vercel. ' +
      'Após configurar, faça um novo deploy.'
    );
  }

  // Criar cliente real com as variáveis de ambiente disponíveis
  supabaseInstance = createClient(finalUrl, finalKey, {
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
