import NextAuth from 'next-auth'
import authConfig from '@/auth.config'

// Edge middleware uses the DB-free config. `/` is the gated home; unauthenticated
// requests are sent to /login. `/login` and `/api/auth/*` stay public.
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  if (req.auth) return
  const { pathname, origin } = req.nextUrl
  const url = new URL('/login', origin)
  if (pathname !== '/') url.searchParams.set('callbackUrl', pathname)
  return Response.redirect(url)
})

export const config = {
  matcher: ['/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)'],
}
