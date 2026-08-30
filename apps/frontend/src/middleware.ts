import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function middleware(req: NextRequest) {
  // Mock mode has no real session cookie — allow browsing the UI.
  if (USE_MOCK) {
    return NextResponse.next();
  }

  const token = req.cookies.get('gtm_token')?.value;

  // Cross-origin reality: when the backend lives on a different registrable
  // domain than the frontend (e.g. Railway vs Vercel), the httpOnly gtm_token
  // cookie is scoped to the backend domain and is NEVER sent to this middleware.
  // We can't validate it here, so we must not redirect — the client + the API's
  // 401 handling enforce auth instead. Middleware only gates when the cookie is
  // actually visible here (shared-domain / same-site or proxied deploys).
  if (!token) {
    return NextResponse.next();
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/users/me`, {
      headers: { Cookie: `gtm_token=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  } catch {
    // Never hard-block on a transient API/network error.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/projects/:path*'],
};
