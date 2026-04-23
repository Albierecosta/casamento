import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: wedding, error } = await supabase
    .from("weddings")
    .select("id, couple_name, plan")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !wedding) {
    return NextResponse.json({ error: "wedding_not_found" }, { status: 404 });
  }
  if (wedding.plan === "premium") {
    return NextResponse.json({ error: "already_premium" }, { status: 400 });
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "missing_stripe_price" }, { status: 500 });
  }

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Let Stripe pick from the methods enabled in your dashboard (card, pix, boleto…)
      customer_email: user.email ?? undefined,
      client_reference_id: wedding.id,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        wedding_id: wedding.id,
        user_id: user.id,
        couple_name: wedding.couple_name ?? "",
      },
      success_url: `${origin}/planos/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/planos`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "stripe_error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
