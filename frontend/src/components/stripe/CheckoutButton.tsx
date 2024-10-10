import React, { useState } from "react";
import { FaSpinner } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { loadStripe } from "@stripe/stripe-js";

import { STRIPE_PUBLISHABLE_KEY } from "../../lib/constants/env";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const CheckoutButton: React.FC<{ productId: string }> = ({ productId }) => {
  const { addErrorAlert } = useAlertQueue();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    const stripe = await stripePromise;

    if (!stripe) {
      console.error("Stripe is not loaded");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_id: productId }),
      });

      if (!response.ok) {
        throw new Error("Failed to start order checkout");
      }

      const session = await response.json();

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.sessionId,
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
    >
      {isLoading ? <FaSpinner className="animate-spin mr-2" /> : null}
      {isLoading ? "Processing..." : "Checkout"}
    </Button>
  );
};

export default CheckoutButton;
