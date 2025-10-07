import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 group" prefetch={false}>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 group-hover:bg-white/30 transition-colors">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <span className="font-bold text-xl text-white">Dashboard Operacional</span>
            <p className="text-blue-100 text-sm">Sistema de Análise</p>
          </div>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all duration-200 transform hover:-translate-y-1 border border-white/20"
            prefetch={false}
          >
            <span>📈</span>
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link
            href="/upload"
            className="flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all duration-200 transform hover:-translate-y-1 border border-white/20"
            prefetch={false}
          >
            <span>📤</span>
            <span className="font-medium">Upload</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
