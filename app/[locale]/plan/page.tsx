import { redirect } from "next/navigation";

export default function PlanRedirectPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  redirect(`/${locale}/course`);
}
