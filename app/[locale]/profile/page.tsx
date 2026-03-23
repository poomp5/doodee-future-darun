import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import BasicProfileForm from "@/components/profile/BasicProfileForm";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getConnectedProvidersForEmail } from "@/lib/auth-linked-accounts";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering to ensure fresh auth state
export const dynamic = "force-dynamic";

async function ProfileInfoLoader() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch user data
  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
  });
  const connectedProviders = await getConnectedProvidersForEmail(session.user.email);

  return (
    <BasicProfileForm
      user={user}
      connectedProviders={connectedProviders}
      sessionUser={session.user}
    />
  );
}

export default function ProfileInfoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" text="กำลังโหลดข้อมูลโปรไฟล์..." />
        </div>
      }
    >
      <ProfileInfoLoader />
    </Suspense>
  );
}
