import { redirect } from "next/navigation";

// Redirect legacy /admin/act to the standalone ACT admin section
export default function ACTAdminRedirect() {
  redirect("/act-admin");
}
