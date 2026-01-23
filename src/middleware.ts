import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;

    // Rotas protegidas
    const protectedRoutes = ['/dashboard', '/admin', '/upload', '/perfil', '/apresentacao'];
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));

    // Redirecionar para login se tentar acessar rota protegida sem usuário
    if (isProtectedRoute && !user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        // Opcional: Adicionar redirectTo para voltar após login
        // url.searchParams.set('redirectTo', path);
        return NextResponse.redirect(url);
    }

    // Redirecionar para dashboard se já estiver logado e tentar acessar login/registro
    if ((path === '/login' || path === '/registro') && user) {
        const dashboardUrl = new URL('/dashboard', request.url);

        // Preservar todos os parâmetros de busca originais para não perder filtros
        request.nextUrl.searchParams.forEach((value, key) => {
            dashboardUrl.searchParams.set(key, value);
        });

        return NextResponse.redirect(dashboardUrl);
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - Public assets (svg, png, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
