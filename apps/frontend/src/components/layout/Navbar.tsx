'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const clearUser = useAuthStore((s) => s.clearUser);

  async function signOut() {
    await api.auth.logout();
    clearUser();
    router.push('/login');
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-gtm-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold text-slate-100">
          Githancer
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/cli-setup"
            className="text-sm text-gtm-muted transition-colors hover:text-slate-100"
          >
            CLI Setup
          </Link>
          {user ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatarUrl}
                alt=""
                className="h-8 w-8 rounded-full border border-slate-700"
              />
              <span className="hidden text-sm text-slate-300 sm:inline">{user.username}</span>
            </>
          ) : isLoading ? (
            <span className="h-8 w-8 animate-pulse rounded-full bg-slate-700" />
          ) : null}
          <Button variant="secondary" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    </nav>
  );
}
