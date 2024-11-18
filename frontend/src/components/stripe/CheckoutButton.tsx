import React, { useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

import { Drawer } from "@/components/Drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/constants/env";
import { ApiError } from "@/lib/types/api";
import ROUTES from "@/lib/types/routes";
import { loadStripe } from "@stripe/stripe-js";

import { InventoryType } from "../listing/types";

interface Props {
  listingId: string;
  stripeProductId: string;
  label?: string;
  inventoryType?: InventoryType;
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const isOutOfStock =
    inventoryType === "finite" &&
    (inventoryQuantity === undefined || inventoryQuantity <= 0);

  const buttonLabel =
    inventoryType === "preorder"
      ? "Pre-order Now"
      : isOutOfStock
        ? "Out of Stock"
        : label;

  const handleCheckoutClick = async () => {
    setIsLoading(true);

    if (!auth.isAuthenticated) {
      setIsDrawerOpen(true);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await auth.client.POST(
        "/stripe/checkout-session",
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

      if (!data || !data.session_id || !data.stripe_connect_account_id) {
        throw new Error("Invalid response from server");
      }

      // Initialize Stripe with the connected account
      const stripeWithAccount = await loadStripe(STRIPE_PUBLISHABLE_KEY, {
        stripeAccount: data.stripe_connect_account_id,
      });

      if (!stripeWithAccount) {
        throw new Error("Failed to initialize Stripe");
      }

      // Redirect to Stripe Checkout
      const result = await stripeWithAccount.redirectToCheckout({
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

  const handleClick = () => {
    setIsDrawerOpen(true);
  };

  const DrawerContent = () => {
    if (!auth.isAuthenticated) {
      return (
        <div className="flex items-center justify-center p-2">
          <div className="p-4 text-white">
            <h2 className="text-lg sm:text-xl font-bold mb-4">
              You must be logged in to place an order.
            </h2>
            <p className="mb-4">
              This is so you can track and receive updates on your order.
            </p>
            <div className="flex sm:flex-row flex-col justify-center gap-4">
              <Button
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigate(ROUTES.LOGIN.path);
                }}
                variant="outline"
              >
                Log In
              </Button>
              <Button
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigate(ROUTES.SIGNUP.path);
                }}
                variant="outline"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center p-2">
        <div className="text-white max-w-md">
          <h2 className="text-lg sm:text-xl font-bold mb-4">
            Order Confirmation
          </h2>
          <div className="mb-6">
            <p className="mb-4">
              By proceeding with this order, you agree to our{" "}
              <a
                href="/eula"
                className="underline hover:text-gray-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                End User License Agreement
              </a>
              ,{" "}
              <a
                href={ROUTES.TOS.path}
                className="underline hover:text-gray-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </a>
              , and{" "}
              <a
                href="/privacy"
                className="underline hover:text-gray-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
              .
            </p>
            {inventoryType === "preorder" && (
              <p className="mb-4">
                This robot is listed for pre-order. By proceeding, you agree to
                our{" "}
                <a
                  href={ROUTES.PREORDER_TERMS.path}
                  className="underline hover:text-gray-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Pre-order Terms
                </a>
                .
              </p>
            )}
          </div>
          <div className="flex items-start space-x-2 mb-6">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) =>
                setAcceptedTerms(checked as boolean)
              }
            />
            <label htmlFor="terms" className="text-sm">
              I understand and agree to the terms and conditions
            </label>
          </div>
          <Button
            onClick={handleCheckoutClick}
            disabled={!acceptedTerms || isLoading}
            className="w-full"
            variant="outline"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Starting checkout...
              </>
            ) : (
              buttonLabel
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isOutOfStock}
        className={`flex items-center justify-center ${
          isOutOfStock ? "bg-gray-600" : "bg-primary"
        }`}
        variant="default"
      >
        {buttonLabel}
      </Button>

      <Drawer open={isDrawerOpen} setOpen={setIsDrawerOpen}>
        <DrawerContent />
      </Drawer>
    </>
  );
};

export default CheckoutButton;
