import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

const credentialSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  userType: z.enum(["admin", "customer", "instructor"]),
});

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/",
  },

  secret: process.env.AUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  jwt: {
    encode: async ({ token, secret }) => {
      if (!secret) throw new Error("Missing secret for JWT encoding");
      const secretString = Array.isArray(secret) ? secret[0] : secret;
      return new SignJWT(token)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24hrs")
        .sign(new TextEncoder().encode(secretString));
    },
    decode: async ({ token, secret }) => {
      if (!secret) throw new Error("Missing secret for JWT decoding");
      const secretString = Array.isArray(secret) ? secret[0] : secret;
      return jwtVerify(token!, new TextEncoder().encode(secretString)).then(
        (res) => res.payload,
      );
    },
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userType = user.userType;
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.userType = token.userType as UserType;
        session.user.id = token.id as string;
      }
      return session;
    },

    async authorized({ auth, request: { nextUrl } }): Promise<boolean> {
      const isLoggedIn = !!auth?.user;
      const userType = auth?.user?.userType;

      if (nextUrl.pathname.startsWith("/admins")) {
        return isLoggedIn && userType === "admin";
      }

      if (nextUrl.pathname.startsWith("/customers")) {
        return isLoggedIn && userType === "customer";
      }

      if (nextUrl.pathname.startsWith("/instructors")) {
        return isLoggedIn && userType === "instructor";
      }

      return true;
    },
  },

  providers: [
    Credentials({
      async authorize(credentials) {
        try {
          const parsedCredentials = credentialSchema.safeParse(credentials);
          if (!parsedCredentials.success) {
            return null;
          }

          const backendOrigin = process.env.BACKEND_ORIGIN;
          if (!backendOrigin) {
            console.error("Missing BACKEND_ORIGIN in auth authorize");
            return null;
          }

          const response = await fetch(`${backendOrigin}/users/authenticate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsedCredentials.data),
            cache: "no-store",
          });

          if (!response.ok) {
            return null;
          }

          const data = (await response.json()) as { id: number };

          return {
            id: String(data.id),
            userType: parsedCredentials.data.userType,
          };
        } catch (error) {
          console.error("Unexpected error in authorize:", error);
          return null;
        }
      },
    }),
  ],
};

export const { auth, signIn, signOut } = NextAuth(authConfig);
