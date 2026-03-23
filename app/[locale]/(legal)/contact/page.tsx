import LegalHubPage from "@/components/legal/LegalHubPage";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: "th" | "en" }>;
}) {
  const { locale } = await params;
  return <LegalHubPage locale={locale} focus="contact" />;
}
