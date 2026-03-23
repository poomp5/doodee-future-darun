import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTodos, getInterestedFaculties } from "@/lib/profile-data";
import TodoContent from "@/components/profile/TodoContent";
import LoadingSpinner from "@/components/LoadingSpinner";

// Force dynamic rendering to ensure fresh auth state
export const dynamic = "force-dynamic";

async function TodoDataLoader() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch todos and interested faculties (needed for AI generation)
  const [todos, interestedFaculties] = await Promise.all([
    getTodos(session.user.id),
    getInterestedFaculties(session.user.id),
  ]);

  return (
    <TodoContent
      userId={session.user.id}
      todos={todos}
      interestedFaculties={Array.isArray(interestedFaculties) ? interestedFaculties : []}
    />
  );
}

export default function TodoListPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" text="กำลังโหลดรายการสิ่งที่ต้องทำ..." />
        </div>
      }
    >
      <TodoDataLoader />
    </Suspense>
  );
}
