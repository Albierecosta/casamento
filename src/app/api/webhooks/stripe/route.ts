import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid";
    return NextResponse.json({ error: `signature_verification_failed: ${message}` }, { status: 400 });
  }

  // We only care about successful checkouts.
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const weddingId = session.metadata?.wedding_id ?? session.client_reference_id;

  if (!weddingId) {
    console.error("[stripe webhook] no wedding_id in session", session.id);
    return NextResponse.json({ error: "no_wedding_id" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Default: 18 months access. Extend if the couple has a wedding date in the future.
  let expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 18);

  const { data: wedding } = await admin
    .from("weddings")
    .select("wedding_date")
    .eq("id", weddingId)
    .maybeSingle();

  if (wedding?.wedding_date) {
    const afterWedding = new Date(wedding.wedding_date);
    afterWedding.setDate(afterWedding.getDate() + 30);
    if (afterWedding.getTime() > expiresAt.getTime()) {
      expiresAt = afterWedding;
    }
  }

  const { error } = await admin
    .from("weddings")
    .update({
      plan: "premium",
      plan_expires_at: expiresAt.toISOString(),
      plan_updated_at: new Date().toISOString(),
    })
    .eq("id", weddingId);

  if (error) {
    console.error("[stripe webhook] failed to upgrade wedding", weddingId, error);
    return NextResponse.json({ error: "db_update_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true, upgraded: weddingId });
}
