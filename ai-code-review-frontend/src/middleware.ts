// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve token from cookies
  const token =
    request.cookies.get('access_token')?.value ||
    request.cookies.get('auth_token')?.value;

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isProtectedRoute = pathname.startsWith('/projects') || pathname.startsWith('/dashboard');

  // 1. If unauthenticated user tries to access protected route -> redirect to /login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If already logged in and visiting /login or /signup -> redirect to /projects
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/projects', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/projects/:path*', '/dashboard/:path*', '/login', '/signup'],
};
