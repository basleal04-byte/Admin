import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => token?.role === "admin",
  },
});

export const config = {
  matcher: [
    "/",
    "/merchants/:path*",
    "/transactions/:path*",
    "/campaigns/:path*",
    "/fees/:path*",
    "/audit/:path*",
  ],
};
