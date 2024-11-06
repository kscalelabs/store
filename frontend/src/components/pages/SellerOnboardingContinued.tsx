import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";

type AccountStatus =
  paths["/stripe/connect-account/status"]["get"]["responses"]["200"]["content"]["application/json"];

export default function SellerOnboardingContinued() {
  const navigate = useNavigate();
  const auth = useAuthentication();
  const { addErrorAlert, addAlert } = useAlertQueue();
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [connectedAccountId, setConnectedAccountId] = useState<string | null>(
    auth.currentUser?.stripe_connect_account_id || null,
  );
  const stripeConnectInstance = useStripeConnect(connectedAccountId);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(
    null,
  );

  const handleCreateNewAccount = async () => {
    try {
      setAccountCreatePending(true);
      console.log("Creating new Stripe Connect account...");

      const { data, error } = await auth.client.POST(
        "/stripe/create-connect-account",
        {},
      );

      if (error) {
        console.error("Error creating Connect account:", error);
        addErrorAlert(error);
        return;
      }

      if (data) {
        const accountId = data.account_id;
        if (accountId) {
          console.log("Account created successfully:", accountId);
          setConnectedAccountId(accountId);

          setTimeout(() => {
            checkAccountStatus();
          }, 1000);
        } else {
          addErrorAlert("No account ID received from server");
        }
      }
    } catch (error) {
      addErrorAlert(`Failed to create seller account: ${error}`);
    } finally {
      setAccountCreatePending(false);
    }
  };

  const handleOnboardingExit = async () => {
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
        navigate("/seller-dashboard");
      } else {
        addErrorAlert(
          "Your stripe account setup is not complete. Please resolve outstanding requirements.",
        );
        navigate("/account");
      }
    } catch (error) {
      addErrorAlert(`Failed to update onboarding status: ${error}`);
    }
  };

  const checkAccountStatus = async () => {
    try {
      const { data, error } = await auth.client.GET(
        "/stripe/connect-account/status",
      );
      if (error) {
        addErrorAlert(error);
        return;
      }
      setAccountStatus(data);
    } catch (error) {
      addErrorAlert(`Failed to check account status: ${error}`);
    }
  };

  useEffect(() => {
    if (auth.isLoading) return;

    if (auth.currentUser?.stripe_connect_onboarding_completed) {
      navigate("/seller-dashboard");
      return;
    }

    if (!auth.currentUser?.stripe_connect_account_id) {
      navigate("/seller-onboarding");
      return;
    }

    if (connectedAccountId && !accountStatus) {
      checkAccountStatus();
    }
  }, [connectedAccountId, auth.currentUser, auth.isLoading]);

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
        <h1 className="text-3xl font-bold mb-6">
          Continue Setting Up Your Seller Account
        </h1>

        {connectedAccountId && (
          <p className="text-gray-11 text-sm">
            This usually takes a few steps/submissions. It may take some time
            for Stripe to process your info between submissions. Continue
            through your account page or refresh this page to check/update your
            application status.
          </p>
        )}

        {!connectedAccountId && (
          <div className="mb-8">
            <p className="mb-4">
              Set up your K-Scale connected Stripe account to start selling
              robots and receiving payments.
            </p>

            <div className="space-y-4">
              <button
                onClick={handleCreateNewAccount}
                disabled={accountCreatePending}
                className="w-full bg-primary-9 text-white px-6 py-3 rounded-lg hover:bg-primary-9/80 disabled:opacity-50"
              >
                {accountCreatePending
                  ? "Creating account..."
                  : "Create New Stripe Account"}
              </button>
            </div>
          </div>
        )}

        {connectedAccountId && !stripeConnectInstance && (
          <div className="mb-8">
            {accountStatus?.status === "incomplete" && (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold text-yellow-800">
                    Account Setup Incomplete
                  </h3>
                  <ul className="mt-2 list-disc list-inside text-yellow-700">
                    {accountStatus?.missing_requirements?.map((req: string) => (
                      <li key={req}>{req}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-4">
                  {accountStatus.account_link && (
                    <a
                      href={accountStatus.account_link}
                      className="flex-1 bg-primary-9 text-white px-6 py-3 rounded-lg hover:bg-primary-9/80 text-center"
                    >
                      Complete Setup in Stripe
                    </a>
                  )}
                  <a
                    href={
                      accountStatus?.dashboard_url ||
                      "https://dashboard.stripe.com/"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 text-center"
                  >
                    Open Stripe Dashboard
                  </a>
                </div>
              </div>
            )}

            {accountStatus?.status === "complete" && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800">
                  Account Setup Complete
                </h3>
                <p className="mt-2 text-green-700">
                  Your Stripe account is fully set up and ready to accept
                  payments.
                </p>
                <a
                  href={
                    accountStatus?.dashboard_url ||
                    "https://dashboard.stripe.com/"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block bg-green-100 text-green-700 px-6 py-3 rounded-lg hover:bg-green-200"
                >
                  Open Stripe Dashboard
                </a>
              </div>
            )}
          </div>
        )}

        {stripeConnectInstance && (
          <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
            <ConnectAccountOnboarding onExit={handleOnboardingExit} />
          </ConnectComponentsProvider>
        )}
      </div>
    </div>
  );
}
