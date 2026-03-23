import Image from "next/image";
import { useTranslations } from "next-intl";

export default function CoursePage() {
  const t = useTranslations("course");

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-white px-4 pb-24 pt-16">
      <div className="mx-auto flex max-w-3xl items-center justify-center">
        <div className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-6 py-10 text-center">
          <Image
            src={"/doodee-mainternace.png"}
            width={250}
            height={250}
            alt="doodee-mainternace"
            className="mx-auto mb-4"
          />
          <p className="text-base font-semibold text-gray-700 sm:text-lg">
            {t("maintenanceTitle")}
          </p>
          <p className="text-base font-medium text-red-600 sm:text-lg">
            {t("maintenanceDesc")}
          </p>
        </div>
      </div>
    </main>
  );
}
