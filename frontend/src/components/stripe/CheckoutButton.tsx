import React, { useState } from "react";
import { FaSpinner } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/constants/env";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const CheckoutButton: React.FC<{ productId: string }> = ({ productId }) => {
  const { addErrorAlert } = useAlertQueue();
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuthentication();

  const handleClick = async () => {
    setIsLoading(true);

    if (!stripePromise) {
      console.error("Stripe configuration is missing");
      addErrorAlert(
        "Payment system is not properly configured. Please contact support.",
      );
      setIsLoading(false);
      return;
    }

    const stripe = await stripePromise;

    if (!stripe) {
      console.error("Failed to initialize Stripe");
      addErrorAlert(
        "Unable to process payment at this time. Please try again later.",
      );
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await auth.client.POST(
        "/stripe/create-checkout-session",
        {
          body: { product_id: productId },
        },
      );

      if (!data || !data.session_id) {
        throw new Error("Invalid response from server");
      }

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId: data.session_id,
      });

      if (result.error) {
        throw result.error;
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addErrorAlert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className="flex items-center justify-center"
      variant="primary"
    >
      {isLoading ? <FaSpinner className="animate-spin mr-2" /> : null}
      {isLoading ? "Processing..." : "Buy Now"}
    </Button>
  );
};

export default CheckoutButton;
