import { supabaseProxy } from '@/lib/supabase/safeProxy';

export const supabase = supabaseProxy;
export { recreateSupabaseClient } from '@/lib/supabase/clientFactory';
