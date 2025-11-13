import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Durante o build, as variáveis de ambiente podem não estar disponíveis
// Criar um cliente mock para evitar erros durante o build
// O cliente real será usado em runtime quando as variáveis estiverem disponíveis
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  // Se já existe uma instância, retornar
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Se as variáveis não estão disponíveis, criar um cliente mock
  // Isso permite que o módulo seja importado durante o build sem erros
  if (!supabaseUrl || !supabaseAnonKey) {
    // Durante o build, criar um cliente com valores dummy
    // Isso será substituído em runtime quando as variáveis estiverem disponíveis
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
