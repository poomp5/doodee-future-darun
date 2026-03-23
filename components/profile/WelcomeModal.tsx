"use client";

import { useEffect } from "react";
import Swal from "@/lib/swal-toast";
import { useTranslations } from "next-intl";

export default function WelcomeModal() {
  const t = useTranslations('profile');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('welcome') === 'referral') {
        Swal.fire({
          icon: "success",
          title: t('welcomeTitle'),
          html: `<p>${t('welcomeMessage')}</p>`,
          confirmButtonColor: "#ec4899",
          confirmButtonText: t('getStarted')
        });
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [t]);

  return null;
}
