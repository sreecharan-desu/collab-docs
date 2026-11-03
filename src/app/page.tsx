import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getDashboardData } from "@/app/actions/documents";
import { DashboardView } from "@/components/dashboard-view";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { owned, shared } = await getDashboardData();

  return (
    <DashboardView
      user={user}
      owned={owned.map((d) => ({ ...d, accessRole: "owner" as const }))}
      shared={shared}
    />
  );
}
