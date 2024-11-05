import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";

export default function SellerOnboarding() {
  const navigate = useNavigate();
  const auth = useAuthentication();
  const { addErrorAlert, addAlert } = useAlertQueue();
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [onboardingExited, setOnboardingExited] = useState(false);
  const [connectedAccountId, setConnectedAccountId] = useState<string | null>(
    null,
  );
  const stripeConnectInstance = useStripeConnect(connectedAccountId);

  const handleCreateAccount = async (isExisting: boolean = false) => {
    try {
      setAccountCreatePending(true);

      const { data, error } = await auth.client.POST(
        "/stripe/create-connect-account",
        { existing_account: isExisting },
      );

      if (error) {
        addErrorAlert(error);
        return;
      }

      if (isExisting && data.url) {
        // Redirect to Stripe's account linking flow
        window.location.href = data.url;
      } else {
        setConnectedAccountId(data.accountId);
        addAlert("Seller account created successfully!", "success");
      }
    } catch (error) {
      addErrorAlert(`Failed to create seller account: ${error}`);
    } finally {
      setAccountCreatePending(false);
    }
  };

  const handleOnboardingExit = async () => {
    setOnboardingExited(true);

    try {
      const { data, error } = await auth.client.POST(
        "/stripe/connect-account/update-onboarding-status",
        {},
      );

      if (error) {
        addErrorAlert(error);
        return;
      }

      if (data.onboarding_completed) {
        addAlert("Seller account setup completed!", "success");
        setTimeout(() => navigate("/account"), 2000);
      } else {
        addErrorAlert(
          "Your account setup is not complete. Please provide all required information.",
        );
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (error) {
      addErrorAlert(`Failed to update onboarding status: ${error}`);
    }
  };

  if (auth.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Seller Onboarding</h1>

        {!connectedAccountId && (
          <div className="mb-8">
            <p className="mb-4">
              Set up your Stripe account to start selling robots and receiving
              payments.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => handleCreateAccount(false)}
                disabled={accountCreatePending}
                className="w-full bg-primary-9 text-white px-6 py-3 rounded-lg hover:bg-primary-9/80 disabled:opacity-50"
              >
                {accountCreatePending
                  ? "Creating account..."
                  : "Create New Stripe Account"}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              <button
                onClick={() => handleCreateAccount(true)}
                disabled={accountCreatePending}
                className="w-full border-2 border-primary-9 text-primary-9 px-6 py-3 rounded-lg hover:bg-primary-9/10 disabled:opacity-50"
              >
                {accountCreatePending
                  ? "Connecting account..."
                  : "Connect Existing Stripe Account"}
              </button>
            </div>

            <p className="mt-4 text-sm text-gray-600">
              Already have a Stripe account? You can connect it to our platform
              and start selling right away.
            </p>
          </div>
        )}

        {stripeConnectInstance && (
          <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
            <ConnectAccountOnboarding onExit={handleOnboardingExit} />
          </ConnectComponentsProvider>
        )}

        {onboardingExited && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p>
              Onboarding process completed. Redirecting to your account page...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
