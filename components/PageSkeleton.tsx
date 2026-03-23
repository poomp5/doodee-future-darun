export default function PageSkeleton() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="h-6 w-48 rounded bg-gray-200" />
        <div className="h-4 w-72 rounded bg-gray-100" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-40 rounded-lg bg-gray-100 border border-gray-200" />
          <div className="h-40 rounded-lg bg-gray-100 border border-gray-200" />
          <div className="h-40 rounded-lg bg-gray-100 border border-gray-200" />
          <div className="h-40 rounded-lg bg-gray-100 border border-gray-200" />
        </div>
        <div className="h-24 rounded-lg bg-gray-50 border border-gray-200" />
      </div>
    </div>
  );
}
