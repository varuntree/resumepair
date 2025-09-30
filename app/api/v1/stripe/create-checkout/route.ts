import { createCheckout } from "@/libs/stripe";
import { createClient } from "@/libs/supabase/server";
import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError } from "@/libs/api-utils";

// This function is used to create a Stripe Checkout Session (one-time payment or subscription)
// It's called by the <ButtonCheckout /> component
// Users must be authenticated. It will prefill the Checkout data with their email and/or credit card (if any)
export const POST = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();

  if (!body.priceId) {
    return apiError(400, "Price ID is required");
  }

  if (!body.successUrl || !body.cancelUrl) {
    return apiError(400, "Success and cancel URLs are required");
  }

  if (!body.mode) {
    return apiError(
      400,
      "Mode is required (either 'payment' for one-time payments or 'subscription' for recurring subscription)"
    );
  }

  const supabase = createClient();
  const { priceId, mode, successUrl, cancelUrl } = body;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const stripeSessionURL = await createCheckout({
    priceId,
    mode,
    successUrl,
    cancelUrl,
    // If user is logged in, it will pass the user ID to the Stripe Session so it can be retrieved in the webhook later
    clientReferenceId: user.id,
    user: {
      email: data?.email,
      // If the user has already purchased, it will automatically prefill it's credit card
      customerId: data?.customer_id,
    },
    // If you send coupons from the frontend, you can pass it here
    // couponId: body.couponId,
  });

  return apiSuccess({ url: stripeSessionURL });
});
