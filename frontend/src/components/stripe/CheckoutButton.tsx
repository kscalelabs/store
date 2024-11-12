import React, { useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

import { Drawer } from "@/components/Drawer";
import { Button } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/constants/env";
import { ApiError } from "@/lib/types/api";
import ROUTES from "@/lib/types/routes";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface Props {
  listingId: string;
  stripeProductId: string;
  label?: string;
  inventoryType?: "finite" | "infinite" | "preorder";
  inventoryQuantity?: number;
}

const CheckoutButton: React.FC<Props> = ({
  listingId,
  stripeProductId,
  label = "Order Now",
  inventoryType,
  inventoryQuantity,
}) => {
  const { addErrorAlert } = useAlertQueue();
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const auth = useAuthentication();
  const navigate = useNavigate();
  const location = useLocation();

  const isOutOfStock =
    inventoryType === "finite" &&
    (inventoryQuantity === undefined || inventoryQuantity <= 0);

  const buttonLabel = isOutOfStock ? "Out of Stock" : label;

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
      const { data, error } = await auth.client.POST(
        "/stripe/create-checkout-session",
        {
          body: {
            listing_id: listingId,
            stripe_product_id: stripeProductId,
            cancel_url: location.pathname,
          },
        },
      );

      if (error) {
        addErrorAlert(`Unable to start checkout: ${error.detail}`);
        setIsLoading(false);
        return;
      }

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
      const apiError = error as ApiError;
      addErrorAlert(`Unable to start checkout: ${apiError.detail}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isLoading || isOutOfStock}
        className={`flex items-center justify-center ${
          isOutOfStock ? "bg-gray-600" : "bg-primary"
        }`}
        variant="default"
      >
        {isLoading ? <FaSpinner className="animate-spin mr-2" /> : null}
        {isLoading ? "Starting checkout..." : buttonLabel}
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
                navigate(ROUTES.LOGIN.path);
              }}
              variant="default"
            >
              Sign In
            </Button>
            <Button
              onClick={() => {
                setIsDrawerOpen(false);
                navigate(ROUTES.SIGNUP.path);
              }}
              variant="default"
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
