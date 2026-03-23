"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useLocale } from "next-intl";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function LogoutPage() {
  const locale = useLocale();

  useEffect(() => {
    void signOut({
      callbackUrl: `/${locale}/login`,
    });
  }, [locale]);

  return <LoadingSpinner fullScreen text="กำลังออกจากระบบ..." />;
}
