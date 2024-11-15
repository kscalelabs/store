import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthentication } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";
import { Check } from "lucide-react";

import { Button } from "../ui/button";

export default function SellerDashboard() {
  const navigate = useNavigate();
  const auth = useAuthentication();

  useEffect(() => {
    auth.fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (auth.isLoading) return;

    if (!auth.isAuthenticated) {
      navigate(ROUTES.LOGIN.path);
      return;
    }

    // Redirect to onboarding if not completed
    if (!auth.currentUser?.stripe_connect?.onboarding_completed) {
      navigate(ROUTES.SELL.ONBOARDING.path);
      return;
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.currentUser]);

  if (auth.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold my-4">Seller Dashboard</h1>

        <h2 className="text-lg font-semibold mb-2">Account Status</h2>
        <div className="flex gap-2 bg-gray-11 text-gray-1 px-3 py-2 items-start sm:items-center rounded-lg">
          <Check />
          <p>
            Your K-Scale seller account is active and ready to receive payments.
          </p>
        </div>

        <div className="mt-8">
          <div className="flex sm:flex-row flex-col gap-2 items-start sm:items-center">
            <a
              href={`https://dashboard.stripe.com/${auth.currentUser?.stripe_connect?.account_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-9 text-primary-12 px-4 py-2 rounded-lg hover:bg-primary-12 hover:text-primary-9 inline-block"
            >
              Open Stripe Dashboard
            </a>
            <Button
              variant="outline"
              onClick={() => navigate(ROUTES.BOTS.SELL.path)}
            >
              Sell a Robot on K-Scale
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
