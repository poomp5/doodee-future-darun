import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  DISCORD_LINK_COOKIE,
  ensureLinkedAuthAccount,
  getLinkedAuthAccount,
} from "@/lib/auth-linked-accounts";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      let isLinkingFlow = false;

      try {
        console.log("=== SignIn Callback Started ===");
        console.log("User email:", user.email);
        console.log("User name:", user.name);
        console.log("Provider:", account?.provider);
        console.log("Timestamp:", new Date().toISOString());

        const cookieStore = await cookies();
        const linkUserId = cookieStore.get(DISCORD_LINK_COOKIE)?.value;
        isLinkingFlow = Boolean(linkUserId);
        const linkedAccount =
          account?.provider && account.providerAccountId
            ? await getLinkedAuthAccount(account.provider, account.providerAccountId)
            : null;

        const linkedEmail = linkedAccount?.User?.email ?? null;
        let targetEmail = linkedEmail ?? user.email ?? null;
        let existingUser = linkUserId
          ? await prisma.users.findUnique({
              where: { id: linkUserId },
            })
          : null;

        if (existingUser?.email) {
          targetEmail = existingUser.email;
        }

        if (!targetEmail) {
          console.error("Cannot resolve target email for OAuth sign in");
          return false;
        }

        if (linkedEmail && existingUser?.email && linkedEmail !== existingUser.email) {
          console.error("OAuth account is already linked to another user");
          return false;
        }

        // Check if user exists in database with timeout
        console.log("Querying database for existing user...");
        if (!existingUser) {
          existingUser = (await Promise.race([
            prisma.users.findUnique({
              where: { email: targetEmail },
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Database query timeout")), 10000),
            ),
          ])) as any;
        }
        console.log("Existing user:", existingUser ? "found" : "not found");
        console.log("Query completed at:", new Date().toISOString());

        if (!existingUser) {
          // Create new user
          const username = targetEmail.split("@")[0];
          const referralCode = Math.random().toString(36).substring(2, 10);
          const newUserId = crypto.randomUUID();

          console.log("Creating new user with id:", newUserId);
          console.log("Username:", username);

          const result = await prisma.users.create({
            data: {
              id: newUserId,
              email: targetEmail,
              full_name: user.name || null,
              profile_image_url: user.image || null,
              username,
              referral_code: referralCode,
              current_points: 0,
              total_points: 0,
            },
          });
          console.log("Insert result:", result);
          console.log("=== New user created successfully ===");
        } else {
          console.log("User already exists, updating...");
          // Update existing user
          await prisma.users.update({
            where: { id: existingUser.id },
            data: {
              full_name: isLinkingFlow
                ? existingUser.full_name
                : user.name || existingUser.full_name,
              profile_image_url: isLinkingFlow
                ? existingUser.profile_image_url
                : user.image || existingUser.profile_image_url,
              updated_at: new Date(),
            },
          });
          console.log("=== User updated successfully ===");
        }

        if (account?.provider && account.providerAccountId && targetEmail) {
          await ensureLinkedAuthAccount({
            email: targetEmail,
            name: existingUser?.full_name || user.name || null,
            image: existingUser?.profile_image_url || user.image || null,
            account: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              type: account.type,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state:
                typeof account.session_state === "string"
                  ? account.session_state
                  : account.session_state?.toString() ?? null,
            },
          });
        }

        return true;
      } catch (error: any) {
        console.error("=== Error in signIn callback ===");
        console.error("Error at:", new Date().toISOString());
        console.error("Error:", error);
        console.error("User email:", user.email);
        console.error("Error message:", error?.message || "Unknown error");
        console.error("Error stack:", error?.stack);
        if (isLinkingFlow) {
          console.log("Blocking sign in because account linking failed");
          return false;
        }
        // Still allow sign in even if database operation fails
        // This prevents users from being locked out due to DB issues
        console.log("Allowing sign in despite error");
        return true;
      }
    },
    async jwt({ token, user, account }) {
      let email = user?.email || token.email;

      if (account?.provider && account.providerAccountId) {
        try {
          const linkedAccount = await getLinkedAuthAccount(
            account.provider,
            account.providerAccountId,
          );

          if (linkedAccount?.User?.email) {
            email = linkedAccount.User.email;
            token.email = linkedAccount.User.email;
          }
        } catch (error) {
          console.error("Error resolving linked OAuth account:", error);
        }
      }

      const shouldFetchDb =
        !!email &&
        (!token.userId ||
          !token.username ||
          token.points === undefined ||
          token.profileImageUrl === undefined);

      if (shouldFetchDb) {
        try {
          const dbUser = await prisma.users.findUnique({
            where: { email },
          });

          if (dbUser) {
            token.userId = dbUser.id;
            token.username = dbUser.username;
            token.points = dbUser.current_points || dbUser.total_points || 0;
            token.profileImageUrl = dbUser.profile_image_url || null;
            token.email = dbUser.email || email;
          }
        } catch (error) {
          console.error("Error in jwt callback:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.username = token.username as string;
        session.user.points = token.points as number;
        if (typeof token.profileImageUrl === "string" && token.profileImageUrl.length > 0) {
          session.user.image = token.profileImageUrl as string;
        }
        // Ensure email from token is always forwarded to session
        if (token.email) {
          session.user.email = token.email as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
});
