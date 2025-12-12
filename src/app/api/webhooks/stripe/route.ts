import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServiceSupabaseClient } from "@/lib/supabase";
import { getStripe, stripeWebhookSecret } from "@/lib/stripe";

export async function POST(req: Request) {
  const signature = headers().get("stripe-signature");
  const rawBody = await req.text();

  if (!stripeWebhookSecret || !signature) {
    return NextResponse.json(
      { error: "Missing Stripe webhook configuration" },
      { status: 400 },
    );
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      stripeWebhookSecret,
    );
  } catch (err) {
    console.error("Stripe webhook error", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  const userId = session.metadata?.userId;
  if (!userId) return;

  const stripe = getStripe();
  const supabase = getServiceSupabaseClient();

  let currentPeriodEnd: Date | undefined;
  try {
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription,
      );
      currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    }
  } catch (err) {
    console.error("Stripe subscription fetch failed", err);
  }

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      plan: "premium",
      status: "active",
      current_period_end: currentPeriodEnd?.toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("Supabase upsert subscription error", error);
  }
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const userId = subscription.metadata?.userId as string | undefined;

  if (!userId) return;

  const supabase = getServiceSupabaseClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({ plan: "free", status: "canceled" })
    .eq("user_id", userId);
  if (error) {
    console.error("Supabase downgrade error", error);
  }
}

