import { withAuth } from "next-auth/middleware";

function isEmployer(token: unknown): boolean {
  if (!token || typeof token !== "object") return false;
  const t = token as { role?: string; isEmployer?: boolean };
  return t.isEmployer === true || t.role === "employer";
}
function isEmployee(token: unknown): boolean {
  if (!token || typeof token !== "object") return false;
  const t = token as { role?: string; isEmployee?: boolean };
  return t.isEmployee === true || t.role === "employee";
}

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;
      if (path.startsWith("/dashboard")) return isEmployer(token);
      if (path.startsWith("/my-payslips")) return isEmployee(token);
      return true;
    },
  },
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/dashboard/:path*", "/my-payslips/:path*"],
};
