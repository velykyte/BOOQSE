import { AddBookFlow } from "@/components/add-book/add-book-flow";

type AddBookPageProps = {
  searchParams: Promise<{ intent?: string }>;
};

export default async function AddBookPage({ searchParams }: AddBookPageProps) {
  const { intent } = await searchParams;
  const mode = intent === "past" ? "past" : "current";

  return (
    <main>
      <AddBookFlow intent={mode} />
    </main>
  );
}
