import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getGpaxEntries } from "@/lib/profile-data";
import GpaxContent from "@/components/profile/GpaxContent";
import LoadingSpinner from "@/components/LoadingSpinner";

// Force dynamic rendering to ensure fresh auth state
export const dynamic = "force-dynamic";

async function GpaxDataLoader() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch only GPAX-related data
  const gpaxEntries = await getGpaxEntries(session.user.id);

  return (
    <GpaxContent
      userId={session.user.id}
      gpaxEntries={gpaxEntries}
    />
  );
}

export default function GpaxPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" text="กำลังโหลดข้อมูล GPAX..." />
        </div>
      }
    >
      <GpaxDataLoader />
    </Suspense>
  );
}
