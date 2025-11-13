import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verificar se estamos em build time
// Durante o build do Next.js, algumas variáveis podem não estar disponíveis
// Mas em runtime (especialmente no Vercel), elas devem estar disponíveis
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    process.env.NEXT_PHASE === 'phase-development-build' ||
                    (typeof window === 'undefined' && !process.env.VERCEL && !process.env.VERCEL_ENV);

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  // Se já existe uma instância e as variáveis estão disponíveis, retornar
  // Mas se tivermos um mock e agora as variáveis estão disponíveis, recriar
  if (supabaseInstance) {
    // Se temos variáveis reais e o cliente atual é mock (URL dummy), recriar
    if (supabaseUrl && supabaseAnonKey && 
        supabaseUrl !== 'https://placeholder.supabase.co' &&
        typeof window !== 'undefined') {
      // Em runtime, recriar com variáveis reais se disponíveis
      supabaseInstance = null; // Forçar recriação
    } else {
      return supabaseInstance;
    }
  }

  // Durante o build, criar um cliente mock para evitar erros
  // Em runtime, as variáveis devem estar disponíveis
  if (isBuildTime && (!supabaseUrl || !supabaseAnonKey)) {
    // Durante o build, criar um cliente com valores dummy
    // Isso permite que o módulo seja importado sem erros
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

  // Em runtime, as variáveis devem estar disponíveis
  if (!supabaseUrl || !supabaseAnonKey) {
    // Em runtime, lançar erro se as variáveis não estiverem disponíveis
    throw new Error('As variáveis de ambiente do Supabase não estão configuradas corretamente. Verifique o arquivo .env.local ou as variáveis de ambiente do Vercel.');
  }

  // Criar cliente real com as variáveis de ambiente disponíveis
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
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
