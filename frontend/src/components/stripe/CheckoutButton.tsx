import React, { useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

import { Drawer } from "@/components/Drawer";
import { Button } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/constants/env";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const CheckoutButton: React.FC<{ productId: string; label?: string }> = ({
  productId,
  label = "Order Now",
}) => {
  const { addErrorAlert } = useAlertQueue();
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const auth = useAuthentication();
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = async () => {
    setIsLoading(true);

    if (!auth.isAuthenticated) {
      setIsDrawerOpen(true);
      setIsLoading(false);
      return;
    }

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
          body: {
            product_id: productId,
            cancel_url: location.pathname,
          },
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
    <>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        className="flex items-center justify-center"
        variant="primary"
      >
        {isLoading ? <FaSpinner className="animate-spin mr-2" /> : null}
        {isLoading ? "Starting checkout..." : label}
      </Button>

      <Drawer open={isDrawerOpen} setOpen={setIsDrawerOpen}>
        <div className="p-4 flex flex-col items-center justify-center">
          <h2 className="text-gray-1 text-2xl font-bold mb-4">
            You must be logged in to place an order.
          </h2>
          <p className="text-gray-3 mb-4">
            This is so you can track and receive updates on your order.
          </p>
          <div className="flex flex-row items-center justify-center">
            <Button
              onClick={() => {
                setIsDrawerOpen(false);
                navigate("/login");
              }}
              variant="secondary"
            >
              Sign In
            </Button>
            <Button
              onClick={() => {
                setIsDrawerOpen(false);
                navigate("/signup");
              }}
              variant="primary"
              className="ml-2"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default CheckoutButton;
