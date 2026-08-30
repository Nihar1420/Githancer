import Link from 'next/link';

const GITHUB_URL = 'https://github.com/Nihar1420/Githancer';

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-white">
          Githancer
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden text-sm text-slate-400 transition-colors hover:text-slate-100 sm:inline"
          >
            GitHub
          </a>
          <a
            href="#how-it-works"
            className="hidden text-sm text-slate-400 transition-colors hover:text-slate-100 sm:inline"
          >
            Docs
          </a>
          <Link
            href="/login"
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
          >
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  );
}
