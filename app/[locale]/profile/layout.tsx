import ProfileTabs from "@/components/profile/ProfileTabs";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f7fb]">
      {/* Mobile: Tab bar sticky under MobileHeader, full-width content below */}
      <div className="md:hidden">
        <div className="sticky top-14 z-20 bg-white border-b border-gray-100 px-3 pt-2 pb-1 shadow-sm">
          <ProfileTabs />
        </div>
        <div className="px-4 py-4 pb-6">
          {children}
        </div>
      </div>

      {/* Desktop: Sidebar + Content */}
      <div className="hidden md:flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <aside className="shrink-0 w-56">
          <div className="sticky top-24 bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 pt-2 pb-3">
              โปรไฟล์
            </p>
            <ProfileTabs />
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
