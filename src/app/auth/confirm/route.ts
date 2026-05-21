import { createServerClient } from '@supabase/ssr';
import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

const ALLOWED_NEXT_PATHS = new Set(['/redefinir-senha', '/dashboard', '/login']);

function sanitizeNextPath(value: string | null) {
  if (!value || !value.startsWith('/')) return '/redefinir-senha';
  if (value.startsWith('//')) return '/redefinir-senha';

  const pathname = value.split('?')[0];
  return ALLOWED_NEXT_PATHS.has(pathname) ? value : '/redefinir-senha';
}

function buildRedirectUrl(request: NextRequest, path: string, error?: string) {
  const redirectUrl = new URL(path, request.url);

  if (error) {
    redirectUrl.pathname = '/redefinir-senha';
    redirectUrl.search = '';
    redirectUrl.searchParams.set('auth_error', error);
  }

  return redirectUrl;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null;
  const code = requestUrl.searchParams.get('code');
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get('next'));

  let redirectUrl = buildRedirectUrl(request, nextPath);
  let response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.redirect(redirectUrl);
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return response;
    }

    redirectUrl = buildRedirectUrl(
      request,
      nextPath,
      'Link expirado ou invalido. Solicite um novo link de redefinicao de senha.'
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }

    redirectUrl = buildRedirectUrl(
      request,
      nextPath,
      'Este link depende do navegador onde foi solicitado. Para redefinir pelo celular, solicite um novo link depois desta atualizacao.'
    );
    return NextResponse.redirect(redirectUrl);
  }

  redirectUrl = buildRedirectUrl(
    request,
    nextPath,
    'Link de redefinicao incompleto. Solicite um novo link de senha.'
  );

  return NextResponse.redirect(redirectUrl);
}
