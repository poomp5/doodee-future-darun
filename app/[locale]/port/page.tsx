"use client";
import { useEffect, useState } from "react";
import R2Image from "@/components/R2Image";
import { Link } from "@/routing";
import { useTranslations } from "next-intl";

type Template = {
  id: string;
  name: string;
  description?: string | null;
  image: string;
  price: number;
  badge: string[];
};

const TemplatesPage = () => {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/db/templates?is_active=true");
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((template: any) => ({
            id: template.id,
            name: template.template_name,
            description: template.description,
            image: template.preview_image_url,
            price: Number(template.price) || 0,
            badge: template.template_type || [],
          }));
          setTemplates(mapped);
        } else {
          setTemplates([]);
        }
      } catch (error) {
        console.error("Error fetching templates", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const Badge = ({ label }: { label: string }) => {
    const colorMap: Record<string, string> = {
      Canva: "bg-purple-600",
      PPTX: "bg-blue-600",
      PSD: "bg-pink-600",
    };

    return (
      <span
        className={`text-white text-xs font-bold px-2 py-1 rounded ${
          colorMap[label] || "bg-gray-500"
        }`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("portfolioTemplates")}
          </h1>
          <p className="text-gray-600 text-sm">{t("templateSubtitle")}</p>
        </div>
        <Link
          href="/analyse"
          className="text-sm font-semibold text-pink-600 hover:underline"
        >
          {tCommon("more")}
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl border p-6 text-center text-gray-600">
          {tCommon("empty") || "No templates available"}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white border rounded-xl shadow-sm hover:shadow-md transition p-4 flex flex-col gap-3"
            >
              <div className="relative w-full aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden">
                <R2Image
                  src={template.image || "/port/1.jpg"}
                  alt={template.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {template.name}
                    </h3>
                    {template.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <span className="text-pink-600 font-bold text-sm">
                    {template.price === 0 ? t("free") : `฿${template.price}`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {template.badge.map((badge, index) => (
                    <Badge key={index} label={badge} />
                  ))}
                </div>
              </div>
              <Link
                href={`/port/${template.id}`}
                className="w-full text-center bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 rounded-lg transition"
              >
                {t("viewTemplate")}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplatesPage;

