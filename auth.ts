import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import { bootstrapInstantUser } from "@/lib/server/bootstrap-user";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/auth",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      const name =
        user.name?.trim() ||
        user.email.split("@")[0] ||
        "Reader";

      await bootstrapInstantUser({
        email: user.email,
        name,
      });

      return true;
    },
  },
};
