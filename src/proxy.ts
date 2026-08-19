import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = ["/auth/login", "/auth/forgot-password", "/auth/reset-password"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  const session = await auth()

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (!session && !isPublic) {
    const loginUrl = new URL("/auth/login", request.nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (session && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
