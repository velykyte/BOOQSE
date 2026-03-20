import { ReflectionFlow } from "@/components/reflections/reflection-flow";
import { getReflectionDraftForSession } from "@/lib/server/reflections";
import { requireInstantUser } from "@/lib/server/session-user";
import { redirect } from "next/navigation";

type ReflectPageProps = {
  searchParams: Promise<{ sessionId?: string; userBookId?: string }>;
};

export default async function ReflectPage({ searchParams }: ReflectPageProps) {
  const auth = await requireInstantUser();
  if (!auth) redirect("/auth");

  const sp = await searchParams;
  const sessionId = sp.sessionId?.trim();
  const userBookId = sp.userBookId?.trim();
  if (!sessionId || !userBookId) redirect("/");

  const draft = await getReflectionDraftForSession(auth.user.id, userBookId, sessionId);
  if (!draft) redirect(`/book/${userBookId}`);

  return (
    <main className="flex flex-col gap-8">
      <ReflectionFlow
        sessionId={sessionId}
        userBookId={userBookId}
        initial={{
          q1: draft.question1,
          q2: draft.question2,
          q3: draft.question3,
          q4: draft.question4,
          q5: draft.question5,
        }}
      />
    </main>
  );
}

