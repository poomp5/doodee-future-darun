import { getTranslations } from "next-intl/server";
import BlogList from "@/components/blog/BlogList";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("blog.pageTitle"),
    description: t("blog.pageDescription"),
    openGraph: {
      title: t("blog.pageTitle"),
      description: t("blog.pageDescription"),
    },
  };
}

export default async function BlogPage() {
  const t = await getTranslations();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {t("blog.pageTitle")}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t("blog.pageDescription")}
          </p>
        </div>

        {/* Blog List */}
        <BlogList />
      </div>
    </div>
  );
}
