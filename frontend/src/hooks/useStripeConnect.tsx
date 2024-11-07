import { useEffect, useState } from "react";

import { useAuthentication } from "@/hooks/useAuth";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/constants/env";
import {
  StripeConnectInstance,
  loadConnectAndInitialize,
} from "@stripe/connect-js";

export const useStripeConnect = (connectedAccountId: string) => {
  const auth = useAuthentication();
  const [stripeConnectInstance, setStripeConnectInstance] =
    useState<StripeConnectInstance>();

  useEffect(() => {
    let mounted = true;

    const initializeStripeConnect = async () => {
      if (connectedAccountId === "") {
        return;
      }

      try {
        const instance = await loadConnectAndInitialize({
          publishableKey: STRIPE_PUBLISHABLE_KEY,
          async fetchClientSecret() {
            const { data, error } = await auth.client.POST(
              "/stripe/connect/account/session",
              { body: { account_id: connectedAccountId } },
            );

            if (error) {
              console.error("Stripe session creation error:", error);
            }

            if (!data?.client_secret) {
              throw new Error("No client secret returned from server");
            }

            return data.client_secret;
          },
          appearance: {
            overlays: "dialog",
            variables: {
              colorPrimary: "#ff4f00",
            },
          },
        });

        if (mounted) {
          setStripeConnectInstance(instance);
        }
      } catch (error) {
        console.error("Failed to initialize Stripe Connect:", error);
        if (mounted) {
          setStripeConnectInstance(undefined);
        }
      }
    };

    initializeStripeConnect();

    return () => {
      mounted = false;
    };
  }, [connectedAccountId, auth.client]);

  return stripeConnectInstance;
};

export default useStripeConnect;
