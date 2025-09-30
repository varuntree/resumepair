import { NextRequest } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { createCustomerPortal } from "@/libs/stripe";
import { withAuth, apiSuccess, apiError } from "@/libs/api-utils";

export const POST = withAuth(async (req: NextRequest, user) => {
  const supabase = createClient();
  const body = await req.json();

  if (!body.returnUrl) {
    return apiError(400, "Return URL is required");
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!data?.customer_id) {
    return apiError(
      400,
      "You don't have a billing account yet. Make a purchase first."
    );
  }

  const stripePortalUrl = await createCustomerPortal({
    customerId: data.customer_id,
    returnUrl: body.returnUrl,
  });

  return apiSuccess({ url: stripePortalUrl });
});
