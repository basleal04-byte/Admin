import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) =>
      !!token?.role &&
      ["super_admin", "ops", "finance", "support", "end_user"].includes(
        token.role as string
      ),
  },
});

export const config = {
  matcher: [
    "/",
    "/profile",
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
    "/approvals/:path*",
    "/campaigns/:path*",
  ],
};
