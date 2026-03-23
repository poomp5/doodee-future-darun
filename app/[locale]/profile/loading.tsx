import LoadingSpinner from "@/components/LoadingSpinner";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" text="กำลังโหลดโปรไฟล์..." />
    </div>
  );
}
