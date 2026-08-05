import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) =>
      !!token?.role &&
      ["super_admin", "ops", "finance", "support"].includes(token.role as string),
  },
});

export const config = {
  matcher: [
    "/",
    "/merchants/:path*",
    "/users/:path*",
    "/transactions/:path*",
    "/escrow/:path*",
    "/redemptions/:path*",
    "/expiry/:path*",
    "/brand/:path*",
    "/fis/:path*",
    "/webhooks/:path*",
    "/push/:path*",
    "/reports/:path*",
    "/admins/:path*",
    "/fees/:path*",
    "/audit/:path*",
    "/campaigns/:path*",
  ],
};
