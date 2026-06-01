type HeaderMap = Record<string, string>;

export async function buildAppAuthHeaders(baseHeaders: HeaderMap = {}): Promise<HeaderMap> {
  if (typeof window === 'undefined') {
    return baseHeaders;
  }

  try {
    const { supabase } = await import('@/lib/supabaseClient');
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      return baseHeaders;
    }

    return {
      ...baseHeaders,
      Authorization: `Bearer ${accessToken}`,
    };
  } catch {
    return baseHeaders;
  }
}
