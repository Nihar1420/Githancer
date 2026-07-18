'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

/**
 * Rehydrates the in-memory auth store on load / refresh by calling
 * /api/v1/users/me. Renders nothing — purely a side effect. Does not redirect
 * on failure; route protection is handled by the middleware + API 401 handling.
 */
export function AuthInitializer() {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.users
      .getMe()
      .then((user) => {
        if (active) setUser(user);
      })
      .catch(() => {
        if (active) clearUser();
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [setUser, clearUser, setLoading]);

  return null;
}
