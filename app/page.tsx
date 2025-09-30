import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Page() {
  return (
    <>
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
        <Button asChild>
          <Link href="/signin">
            Login
          </Link>
        </Button>
      </header>

      <main>
        <section className="flex flex-col items-center justify-center text-center gap-8 px-8 py-24 min-h-[80vh]">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground max-w-3xl">
            AI-Powered Résumé & Cover Letter Builder
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            Create professional, ATS-optimized résumés and cover letters in under 60 seconds.
            Export to PDF or DOCX with live preview.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Button asChild size="lg" className="min-w-[200px]">
              <Link href="/signin">
                Get Started Free
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
