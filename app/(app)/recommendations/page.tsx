import { redirect } from "next/navigation";
import { requireInstantUser } from "@/lib/server/session-user";
import { getRecommendationsPageView } from "@/lib/server/recommendations";
import { RecommendationsPageClient } from "@/components/recommendations/recommendations-page-client";

export default async function RecommendationsPage() {
  const auth = await requireInstantUser();
  if (!auth) {
    redirect("/auth");
  }

  const view = await getRecommendationsPageView(auth.user.id);

  return (
    <RecommendationsPageClient
      eligible={view.ratedBooksCount >= 3}
      ratedBooksCount={view.ratedBooksCount}
      refreshRemaining={view.refreshRemaining}
      latestItems={view.latestItems}
    />
  );
}
