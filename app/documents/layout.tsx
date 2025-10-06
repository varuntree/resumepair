import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";

/**
 * Documents Layout
 *
 * Route-specific layout for Documents (within app group).
 * Only ensures auth and renders children.
 */
export default async function DocumentsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/signin');
  return children as ReactNode;
}
