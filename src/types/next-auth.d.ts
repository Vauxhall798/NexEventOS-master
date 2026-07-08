import type { UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Augments NextAuth's built-in types with the fields our authorize()/jwt()/
// session() callbacks actually put on the token and session — without this,
// `session.user.role` doesn't type-check anywhere it's read.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
