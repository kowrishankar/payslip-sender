import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const secret = process.env.NEXTAUTH_SECRET;

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        const [businessCount, employeeLinkCount] = await Promise.all([
          prisma.business.count({ where: { employerId: user.id } }),
          prisma.businessEmployee.count({ where: { employeeId: user.id } }),
        ]);
        const isEmployer = businessCount > 0;
        const isEmployee = employeeLinkCount > 0;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isEmployer,
          isEmployee,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { role?: string; isEmployer?: boolean; isEmployee?: boolean };
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = u.role;
        token.isEmployer = u.isEmployer;
        token.isEmployee = u.isEmployee;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const t = token as { role?: string; isEmployer?: boolean; isEmployee?: boolean };
        (session.user as { id?: string; role?: string; isEmployer?: boolean; isEmployee?: boolean }).id = token.sub ?? undefined;
        (session.user as { role?: string }).role = t.role as string | undefined;
        (session.user as { isEmployer?: boolean }).isEmployer = t.isEmployer;
        (session.user as { isEmployee?: boolean }).isEmployee = t.isEmployee;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isEmployer: boolean;
  isEmployee: boolean;
}

export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const token = await getToken({ req, secret });
  if (!token?.sub || !token.email) return null;
  const t = token as { role?: string; isEmployer?: boolean; isEmployee?: boolean };
  const isEmployer = t.isEmployer ?? t.role === "employer";
  const isEmployee = t.isEmployee ?? t.role === "employee";
  return {
    id: token.sub,
    email: token.email as string,
    name: (token.name as string) ?? "",
    role: (t.role as string) ?? "employee",
    isEmployer,
    isEmployee,
  };
}
