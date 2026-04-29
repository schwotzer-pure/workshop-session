import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "ADMIN" | "TRAINER";
      username: string;
      organizationId: string | null;
    };
  }

  interface User {
    role?: "ADMIN" | "TRAINER";
    username?: string;
    organizationId?: string | null;
  }
}
