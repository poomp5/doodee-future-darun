import { prisma } from "@/lib/prisma";

export const DISCORD_LINK_COOKIE = "discord_link_user_id";

type ProviderAccountInput = {
  provider: string;
  providerAccountId: string;
  type?: string | null;
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
};

type AuthRegistryUserInput = {
  email: string;
  name?: string | null;
  image?: string | null;
};

export async function getLinkedAuthAccount(
  provider: string,
  providerAccountId: string,
) {
  return prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
    include: {
      User: true,
    },
  });
}

export async function ensureAuthRegistryUser({
  email,
  name,
  image,
}: AuthRegistryUserInput) {
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    const shouldUpdateName = !!name && name !== existing.name;
    const shouldUpdateImage = !!image && image !== existing.image;

    if (shouldUpdateName || shouldUpdateImage) {
      return prisma.user.update({
        where: { id: existing.id },
        data: {
          name: name ?? existing.name,
          image: image ?? existing.image,
          updatedAt: new Date(),
        },
      });
    }

    return existing;
  }

  return prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email,
      name: name ?? null,
      image: image ?? null,
      updatedAt: new Date(),
    },
  });
}

export async function ensureLinkedAuthAccount({
  email,
  name,
  image,
  account,
}: AuthRegistryUserInput & { account: ProviderAccountInput }) {
  const authUser = await ensureAuthRegistryUser({ email, name, image });
  const existingAccount = await getLinkedAuthAccount(
    account.provider,
    account.providerAccountId,
  );

  if (existingAccount && existingAccount.userId !== authUser.id) {
    throw new Error("OAuth account is already linked to another user");
  }

  const accountData = {
    userId: authUser.id,
    type: account.type ?? "oauth",
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    refresh_token: account.refresh_token ?? null,
    access_token: account.access_token ?? null,
    expires_at: account.expires_at ?? null,
    token_type: account.token_type ?? null,
    scope: account.scope ?? null,
    id_token: account.id_token ?? null,
    session_state: account.session_state ?? null,
  };

  if (existingAccount) {
    return prisma.account.update({
      where: { id: existingAccount.id },
      data: accountData,
    });
  }

  return prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      ...accountData,
    },
  });
}

export async function getConnectedProvidersForEmail(email?: string | null) {
  if (!email) {
    return {
      google: false,
      discord: false,
    };
  }

  const authUser = await prisma.user.findUnique({
    where: { email },
    select: {
      Account: {
        select: {
          provider: true,
        },
      },
    },
  });

  const providers = new Set(authUser?.Account.map((item) => item.provider) ?? []);

  return {
    google: providers.has("google"),
    discord: providers.has("discord"),
  };
}
