import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2" prefetch={false}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <line x1="12" x2="12" y1="20" y2="10" />
            <line x1="18" x2="18" y1="20" y2="4" />
            <line x1="6" x2="6" y1="20" y2="16" />
          </svg>
          <span className="font-semibold">Dashboard Geral</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className="text-gray-900 transition-colors hover:text-gray-900/80 dark:text-gray-50 dark:hover:text-gray-50/80"
            prefetch={false}
          >
            Dashboard
          </Link>
          <Link
            href="/upload"
            className="text-gray-900 transition-colors hover:text-gray-900/80 dark:text-gray-50 dark:hover:text-gray-50/80"
            prefetch={false}
          >
            Upload
          </Link>
        </nav>
      </div>
    </header>
  );
}
