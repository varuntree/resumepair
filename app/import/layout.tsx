import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import config from "@/config";

/**
 * Import Layout
 *
 * Protected layout for PDF import pages.
 * Includes Header, Sidebar, and Footer.
 */
export default async function ImportLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(config.auth.loginUrl);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
