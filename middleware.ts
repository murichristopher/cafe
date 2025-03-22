import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl

  // Check if we have supabase session cookie
  const hasSessionCookie = request.cookies.has('sb-access-token') ||
                          request.cookies.has('sb-refresh-token') ||
                          request.cookies.has('supabase-auth-token')

  // If no session cookie found and trying to access protected route
  if (pathname.startsWith('/dashboard') && !hasSessionCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Add a parameter to indicate why they're being redirected
    url.searchParams.set('redirected', 'unauthenticated')
    return NextResponse.redirect(url)
  }

  // If the user is authenticated, allow the request to proceed
  // Add custom headers to help with hydration
  const response = NextResponse.next()

  // Add cache control headers to prevent hydration mismatches
  response.headers.set('Cache-Control', 'no-store, max-age=0')

  // Set a clean Permissions-Policy header without unrecognized features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  return response
}

// Run this middleware on all routes to prevent hydration issues
export const config = {
  matcher: [
    // Protected routes that require authentication
    '/dashboard/:path*',

    // Apply to other routes as well to ensure consistent headers
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}