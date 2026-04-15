import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

type UserRole = "ADMINISTRATIVO" | "EMPLEADO" | "CONTADOR" | "OTRO_ADMINISTRATIVO";

declare module "next-auth" {
  interface Session {
    user: {
      role: UserRole;
      branchId?: string | null;
      avatarUrl?: string | null;
    } & DefaultSession["user"] & { id: string };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credenciales",
      credentials: {
        email: { label: "Correo electrónico", type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.isActive) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          branchId: user.branchId,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.branchId = user.branchId;
        token.avatarUrl = user.avatarUrl;
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.branchId = token.branchId;
        session.user.avatarUrl = token.avatarUrl;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
});
