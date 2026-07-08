import { Webhook } from "standardwebhooks";
import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

interface DodoPaymentEvent {
  type: string;
  data: {
    payment_id: string;
    total_amount: number;
    currency: string;
    metadata?: Record<string, string>;
  };
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const webhookHeaders = {
    "webhook-id": request.headers.get("webhook-id") ?? "",
    "webhook-signature": request.headers.get("webhook-signature") ?? "",
    "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
  };

  try {
    const webhook = new Webhook(process.env.DODO_WEBHOOK_SECRET!);
    await webhook.verify(payload, webhookHeaders);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(payload) as DodoPaymentEvent;

  if (event.type === "payment.succeeded") {
    const userId = event.data.metadata?.user_id;
    if (!userId) {
      return NextResponse.json({ error: "Missing user_id in metadata" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    await supabase.from("purchases").upsert(
      {
        user_id: userId,
        dodo_payment_id: event.data.payment_id,
        amount: event.data.total_amount,
        currency: event.data.currency,
        status: "completed",
      },
      { onConflict: "dodo_payment_id" },
    );

    await supabase
      .from("profiles")
      .update({ has_purchased: true, purchased_at: new Date().toISOString() })
      .eq("id", userId);
  }

  if (event.type === "refund.completed" || event.type === "payment.failed") {
    const userId = event.data.metadata?.user_id;
    if (userId) {
      const supabase = createServiceRoleClient();
      await supabase
        .from("purchases")
        .update({ status: event.type === "refund.completed" ? "refunded" : "failed" })
        .eq("dodo_payment_id", event.data.payment_id);
    }
  }

  return NextResponse.json({ received: true });
}
