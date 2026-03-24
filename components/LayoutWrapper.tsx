"use client";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import MobileHeader from "./MobileHeader";
import BottomBar, { MobileFooter } from "./BottomBar";
import Footer from "./Footer";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Check if we're on admin pages (including ACT admin)
  const isAdminPage = pathname.includes("/admin") || pathname.includes("/act-admin");

  if (isAdminPage) {
    // Admin pages render without navbar/bottombar
    return <>{children}</>;
  }

  // Regular pages with navbar and bottombar
  return (
    <div className="flex flex-col flex-1">
      <Navbar />
      <MobileHeader />
      <div className="pt-14 pb-20 md:pt-20 md:pb-0 flex-1">{children}</div>
      <Footer />
      <MobileFooter />
      <BottomBar />
    </div>
  );
}
