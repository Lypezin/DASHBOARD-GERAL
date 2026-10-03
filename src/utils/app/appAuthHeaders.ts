type HeaderMap = Record<string, string>;

export async function buildAppAuthContext(baseHeaders: HeaderMap = {}, accessTokenOverride?: string): Promise<{
  headers: HeaderMap;
  cacheScopeKey: string | null;
}> {
  if (accessTokenOverride) {
    return {
      headers: {
        ...baseHeaders,
        Authorization: `Bearer ${accessTokenOverride}`,
      },
      cacheScopeKey: null,
    };
  }

  if (typeof window === 'undefined') {
    return { headers: baseHeaders, cacheScopeKey: null };
  }

  try {
    const { supabase } = await import('@/lib/supabaseClient');
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      return { headers: baseHeaders, cacheScopeKey: 'anonymous' };
    }

    return {
      headers: {
        ...baseHeaders,
        Authorization: `Bearer ${accessToken}`,
      },
      cacheScopeKey: session?.user?.id || null,
    };
  } catch {
    return { headers: baseHeaders, cacheScopeKey: 'anonymous' };
  }
}

export async function buildAppAuthHeaders(baseHeaders: HeaderMap = {}, accessTokenOverride?: string): Promise<HeaderMap> {
  const context = await buildAppAuthContext(baseHeaders, accessTokenOverride);
  return context.headers;
}
