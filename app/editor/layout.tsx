import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";

/**
 * Route-specific layout for Editor (within app group).
 * Only ensures auth and renders children.
 */
export default async function EditorLayoutRoot({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');
  return children as ReactNode;
}
