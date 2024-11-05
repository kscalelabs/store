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
    if (connectedAccountId) {
      const fetchClientSecret = async () => {
        const { data, error } = await auth.client.POST(
          "/stripe/connect-account/create-session",
          {},
        );

        if (error) {
          throw new Error(`Failed to create account session: ${error}`);
        }

        return data.client_secret;
      };

      setStripeConnectInstance(
        loadConnectAndInitialize({
          publishableKey: STRIPE_PUBLISHABLE_KEY,
          fetchClientSecret,
          appearance: {
            overlays: "dialog",
            variables: {
              colorPrimary: "#ff4f00",
            },
          },
        }),
      );
    }
  }, [connectedAccountId, auth.client]);

  return stripeConnectInstance;
};

export default useStripeConnect;
