import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getEducationHistory,
  getAchievements,
  getSkills,
  getInterests,
  getExtracurricular,
  getCareerGoals,
  getPortfolioUploads,
  getPurchases,
} from "@/lib/profile-data";
import PortfolioContent from "@/components/profile/PortfolioContent";
import LoadingSpinner from "@/components/LoadingSpinner";

// Force dynamic rendering to ensure fresh auth state
export const dynamic = "force-dynamic";

async function PortfolioDataLoader() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch only portfolio-related data in parallel
  const [
    educationHistory,
    achievements,
    skills,
    interests,
    extracurricular,
    careerGoals,
    portfolioUploads,
    purchases,
  ] = await Promise.all([
    getEducationHistory(session.user.id),
    getAchievements(session.user.id),
    getSkills(session.user.id),
    getInterests(session.user.id),
    getExtracurricular(session.user.id),
    getCareerGoals(session.user.id),
    getPortfolioUploads(session.user.id),
    getPurchases(session.user.id),
  ]);

  return (
    <PortfolioContent
      userId={session.user.id}
      educationHistory={educationHistory}
      achievements={achievements}
      skills={skills}
      interests={interests}
      extracurricular={extracurricular}
      careerGoals={careerGoals}
      portfolioUploads={portfolioUploads}
      purchases={purchases}
    />
  );
}

export default function PortfolioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" text="กำลังโหลดพอร์ตโฟลิโอ..." />
        </div>
      }
    >
      <PortfolioDataLoader />
    </Suspense>
  );
}
