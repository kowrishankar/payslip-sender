import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;
      if (path.startsWith("/dashboard")) return token?.role === "employer";
      if (path.startsWith("/my-payslips")) return token?.role === "employee";
      return true;
    },
  },
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/dashboard/:path*", "/my-payslips/:path*"],
};
