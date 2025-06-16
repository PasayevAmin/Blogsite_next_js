// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET as string

const protectedRoutes = ['/', '/profile'] // Qorunan səhifələr

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // ✅ Qorunan route-a giriş cəhdi və token yoxdursa → login-ə yönləndir
  if (protectedRoutes.includes(pathname)) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // ✅ Token varsa onu yoxla
    try {
      jwt.verify(token, JWT_SECRET)
    } catch (err) {
      // Token etibarsızdırsa loginə yönləndir
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // ✅ Əgər login olmuş istifadəçi `/login` səhifəsinə gedirsə, ana səhifəyə yönləndir
  if (pathname === '/login' && token) {
    try {
      jwt.verify(token, JWT_SECRET)
      return NextResponse.redirect(new URL('/', request.url))
    } catch {
      // Token etibarsız olsa belə burax (login səhifəsi açılsın)
    }
  }

  return NextResponse.next()
}
