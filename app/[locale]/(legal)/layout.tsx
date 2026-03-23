import LegalTabs from "@/components/legal/LegalTabs";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f7fb]">
      <div className="md:hidden">
        <div className="sticky top-14 z-20 bg-white border-b border-gray-100 px-3 pt-2 pb-1 shadow-sm">
          <LegalTabs />
        </div>
        <div className="px-4 py-4 pb-6">{children}</div>
      </div>

      <div className="hidden md:flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <aside className="shrink-0 w-64">
          <div className="sticky top-24 bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
            <p className="px-4 pt-2 pb-3 text-xs font-semibold text-gray-400">
              เอกสารทางกฎหมาย
            </p>
            <LegalTabs />
          </div>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
