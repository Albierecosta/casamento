import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Ensure the user has a wedding row (fresh sign-up via email confirm)
      const { data: existing } = await supabase
        .from("weddings")
        .select("id")
        .eq("owner_id", data.user.id)
        .maybeSingle();
      if (!existing) {
        await supabase.from("weddings").insert({
          owner_id: data.user.id,
          couple_name: (data.user.user_metadata as { couple_name?: string })?.couple_name ?? "Nosso casamento",
        });
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=callback`);
}
