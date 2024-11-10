import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Spinner from "@/components/ui/Spinner";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import ROUTES from "@/lib/types/routes";
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";

export default function SellerOnboarding() {
  const navigate = useNavigate();
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [onboardingExited, setOnboardingExited] = useState(false);
  const [connectedAccountId, setConnectedAccountId] = useState<string>(
    auth.currentUser?.stripe_connect_account_id || "",
  );

  // Wait for user data to be loaded before initializing Stripe Connect
  useEffect(() => {
    if (!auth.isLoading && auth.currentUser?.stripe_connect_account_id) {
      setConnectedAccountId(auth.currentUser.stripe_connect_account_id);
    }
  }, [auth.isLoading, auth.currentUser]);

  // Only initialize Stripe Connect when we have a valid account ID
  const stripeConnectInstance = useStripeConnect(connectedAccountId || "");

  useEffect(() => {
    if (auth.currentUser?.stripe_connect_onboarding_completed) {
      navigate(ROUTES.SELL.path);
    }
  }, [auth.currentUser, navigate]);

  if (auth.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center max-w-2xl mx-auto">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    navigate(ROUTES.LOGIN.path);
    return null;
  }

  const handleCreateAccount = async () => {
    try {
      setAccountCreatePending(true);
      const { data, error } = await auth.client.POST(
        "/stripe/connect/account",
        {},
      );

      if (error) {
        addErrorAlert(error);
        return;
      }

      if (data?.account_id) {
        setConnectedAccountId(data.account_id);
        // Refresh user data to get updated stripe connect account id
        await auth.fetchCurrentUser();
      }
    } catch (error) {
      addErrorAlert(`Failed to create seller account: ${error}`);
    } finally {
      setAccountCreatePending(false);
    }
  };

  const showStripeConnect = connectedAccountId && stripeConnectInstance;

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Start Selling on K-Scale</h1>

        {!connectedAccountId && (
          <div className="mb-8">
            <p className="mb-4">
              Set up your K-Scale connected Stripe account to start selling
              robots and receiving payments.
            </p>

            <button
              onClick={handleCreateAccount}
              disabled={accountCreatePending}
              className="w-full text-white px-6 py-3 rounded-lg disabled:opacity-50"
            >
              {accountCreatePending
                ? "Creating account..."
                : "Start seller onboarding"}
            </button>
          </div>
        )}

        {showStripeConnect && stripeConnectInstance && (
          <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
            <ConnectAccountOnboarding
              onExit={() => {
                setOnboardingExited(true);
                navigate(ROUTES.SELL.path);
              }}
            />
          </ConnectComponentsProvider>
        )}

        {(connectedAccountId || accountCreatePending || onboardingExited) && (
          <div className="mt-10 p-3 rounded-lg text-sm">
            {connectedAccountId && (
              <div className="flex flex-col gap-2">
                <span className="font-semibold">
                  Complete the onboarding process to start selling robots.
                </span>
                <div className="flex items-center gap-2">
                  Connected account ID:{" "}
                  <code className="font-mono bg-gray-5 rounded-md p-1">
                    {connectedAccountId}
                  </code>
                </div>
                <span className="font-semibold">
                  This usually takes a few steps/submissions.
                </span>
                <span className="font-light">
                  It may take some time for Stripe to process your info between
                  submissions. Continue through your account page or refresh
                  this page to check/update your application status.
                </span>
              </div>
            )}
            {accountCreatePending && (
              <p>Creating a K-Scale Stripe connected account...</p>
            )}
            {onboardingExited && <p>Account setup completed</p>}
          </div>
        )}
      </div>
    </div>
  );
}
