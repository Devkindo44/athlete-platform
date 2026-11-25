import type { DefaultSession } from "next-auth";
import "next-auth/jwt";

export type AppRole = "MEMBER" | "ATHLETE" | "COACH" | "ADMIN";

declare module "next-auth" {
  interface User {
    role?: AppRole;
  }

  interface Session {
    user: {
      id: string;
      role: AppRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    role?: AppRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: AppRole;
  }
}