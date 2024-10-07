import { loadStripe } from "@stripe/stripe-js";

import { STRIPE_PUBLISHABLE_KEY } from "../../lib/constants/env";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const CheckoutButton = ({ productId }: { productId: string }) => {
  const handleClick = async () => {
    const stripe = await stripePromise;

    if (!stripe) {
      console.error("Stripe is not loaded");
      return;
    }

    const response = await fetch("/stripe/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ product_id: productId }),
    });

    const session = await response.json();

    // Redirect to Stripe Checkout
    const result = await stripe.redirectToCheckout({
      sessionId: session.sessionId,
    });

    if (result.error) {
      // Handle any errors that occur during the redirect
      console.error(result.error);
    }
  };

  return <button onClick={handleClick}>Checkout</button>;
};

export default CheckoutButton;
