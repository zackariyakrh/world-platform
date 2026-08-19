import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

async function getDb() {
  const { db } = await import("@/lib/db")
  return db
}

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const bcrypt = await import("bcryptjs")
        const db = await getDb()

        const user = await db.user.findUnique({
          where: { email },
        })

        if (!user || !user.passwordHash) return null

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
        if (!isPasswordValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        const db = await getDb()
        const fullUser = await db.user.findUnique({ where: { id: user.id } })
        if (fullUser) {
          token.role = fullUser.role
          token.isSuperAdmin = fullUser.isSuperAdmin
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
        ;(session.user as any).role = token.role
        ;(session.user as any).isSuperAdmin = token.isSuperAdmin
      }
      return session
    },
  },
})
