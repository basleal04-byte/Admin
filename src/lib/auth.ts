import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MOCK_MFA_CODE, MOCK_USERS } from "@/lib/mock-data";
import { verifyPassword } from "@/lib/password";
import {
  assertLoginAllowed,
  clearLoginFailures,
  recordLoginFailure,
} from "@/lib/rate-limit";
import { appendAudit } from "@/lib/store";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 60,
  },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        mfaCode: { label: "MFA", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase() ?? "";
        const password = credentials?.password ?? "";
        const mfaCode = credentials?.mfaCode?.trim() ?? "";
        const key = `login:${email}`;

        try {
          assertLoginAllowed(key);
        } catch (e) {
          throw e;
        }

        if (!email || !password || !mfaCode) {
          recordLoginFailure(key);
          return null;
        }

        const user = MOCK_USERS.find((u) => u.email.toLowerCase() === email);
        if (!user) {
          recordLoginFailure(key);
          appendAudit({
            action: "auth.login_failed",
            actor: email || "unknown",
            target: "panel",
            detail: "Unknown account",
          });
          return null;
        }

        const passwordOk = await verifyPassword(password, user.passwordHash);
        if (!passwordOk) {
          recordLoginFailure(key);
          appendAudit({
            action: "auth.login_failed",
            actor: user.email,
            target: "panel",
            detail: "Invalid password",
          });
          return null;
        }

        if (user.mfaEnabled && mfaCode !== MOCK_MFA_CODE) {
          recordLoginFailure(key);
          appendAudit({
            action: "auth.login_failed",
            actor: user.email,
            target: "panel",
            detail: "Invalid MFA code",
          });
          return null;
        }

        if (user.role !== "admin") {
          recordLoginFailure(key);
          appendAudit({
            action: "auth.login_failed",
            actor: user.email,
            target: "panel",
            detail: "Non-admin role cannot access panel",
          });
          return null;
        }

        clearLoginFailures(key);
        appendAudit({
          action: "auth.login",
          actor: user.email,
          target: "panel",
          detail: "Admin session established",
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "admin";
      }
      return session;
    },
  },
};
