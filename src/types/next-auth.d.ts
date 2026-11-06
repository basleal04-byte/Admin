import "next-auth";
import "next-auth/jwt";
import type { AdminRole } from "@/types";

declare module "next-auth" {
  interface User {
    role?: AdminRole;
    consumerId?: string;
  }

  interface Session {
    user: {
      id: string;
      role: AdminRole;
      consumerId?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: AdminRole;
    consumerId?: string;
  }
}
