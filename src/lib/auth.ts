import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

const secret = process.env.NEXTAUTH_SECRET;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const token = await getToken({ req, secret });
  if (!token?.sub || !token.email || !token.role) return null;
  return {
    id: token.sub,
    email: token.email as string,
    name: (token.name as string) ?? "",
    role: token.role as string,
  };
}
