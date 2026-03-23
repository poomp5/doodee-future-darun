import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getInterestedFaculties } from "@/lib/profile-data";
import FacultyContent from "@/components/profile/FacultyContent";
import LoadingSpinner from "@/components/LoadingSpinner";

// Force dynamic rendering to ensure fresh auth state
export const dynamic = "force-dynamic";

async function FacultyDataLoader() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch only faculty-related data
  const interestedFaculties = await getInterestedFaculties(session.user.id);

  return (
    <FacultyContent
      userId={session.user.id}
      interestedFaculties={Array.isArray(interestedFaculties) ? interestedFaculties : []}
    />
  );
}

export default function FacultyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" text="กำลังโหลดข้อมูลคณะ..." />
        </div>
      }
    >
      <FacultyDataLoader />
    </Suspense>
  );
}
