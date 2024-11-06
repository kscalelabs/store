import { useEffect, useState } from "react";

import {
  StripeConnectInstance,
  loadConnectAndInitialize,
} from "@stripe/connect-js";

import { STRIPE_PUBLISHABLE_KEY } from "../lib/constants/env";
import { useAuthentication } from "./useAuth";

export const useStripeConnect = (connectedAccountId: string | null) => {
  const auth = useAuthentication();
  const [stripeConnectInstance, setStripeConnectInstance] = useState<
    StripeConnectInstance | undefined
  >();

  useEffect(() => {
    let mounted = true;

    const initializeStripeConnect = async () => {
      if (!connectedAccountId) {
        return;
      }

      try {
        const instance = await loadConnectAndInitialize({
          publishableKey: STRIPE_PUBLISHABLE_KEY,
          async fetchClientSecret() {
            const { data, error } = await auth.client.POST(
              "/stripe/connect-account/create-session",
              {},
            );

            if (error) {
              throw new Error(`Failed to create account session: ${error}`);
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
