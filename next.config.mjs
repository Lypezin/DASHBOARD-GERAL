// import bundleAnalyzer from '@next/bundle-analyzer';

// const withBundleAnalyzer = bundleAnalyzer({
//   enabled: process.env.ANALYZE === 'true',
// });

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimizações de performance
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // Otimizações de build
  // swcMinify: true, // Deprecated in Next.js 13+ (enabled by default)
  output: 'standalone',

  // Otimizações de imagens
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Configuração do webpack para ignorar pdfmake no servidor
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      // Ignorar pdfmake no servidor (SSR) - não tentar resolver durante o build do servidor
      config.externals = config.externals || [];
      config.externals.push({
        'pdfmake/build/pdfmake': 'commonjs pdfmake/build/pdfmake',
        'pdfmake/build/vfs_fonts': 'commonjs pdfmake/build/vfs_fonts',
      });
    }

    // Ignorar módulos Node.js no cliente se necessário
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/favicon.ico',
        destination: '/favicon.svg',
        permanent: true,
      },
    ];
  },

  // Headers de segurança e performance
  async headers() {
    return [
      {
        // Headers de segurança globais
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'self'",
            ].join('; ')
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
      {
        // Cache agressivo APENAS para imagens e fontes (que não mudam frequentemente ou têm hash)
        source: '/:path*.{jpg,jpeg,png,gif,webp,avif,ico,svg,woff,woff2,ttf,eot}',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        // Desabilitar cache para arquivos de build do Next.js e HTML para garantir que o usuário sempre receba a versão mais recente
        source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          }
        ]
      }
    ];
  },

  // Forçar um ID de build único para invalidar caches persistentes
  generateBuildId: async () => {
    // Retorna o timestamp atual como ID de build
    return `build-${Date.now()}`;
  },
};

export default nextConfig;
