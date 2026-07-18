import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

export function middleware(req: NextRequest) {
  // In mock mode there is no real session cookie — allow browsing the UI.
  if (USE_MOCK) {
    return NextResponse.next();
  }
  const token = req.cookies.get('gtm_token');
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/projects/:path*'],
};
