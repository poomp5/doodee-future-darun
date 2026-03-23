"use client";

import { SessionProvider, useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { useLocale } from "next-intl";
import { useRouter } from "@/routing";
import { createContext, useContext } from "react";

type User = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  username?: string;
  points?: number;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = useLocale();

  const user: User | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        username: session.user.username,
        points: session.user.points,
      }
    : null;

  const signOut = async () => {
    const callbackUrl = `/${locale}/login`;

    try {
      await nextAuthSignOut({ redirect: false, callbackUrl });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading: status === "loading", signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
