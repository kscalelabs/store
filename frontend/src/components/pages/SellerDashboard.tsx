import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthentication } from "@/hooks/useAuth";
import { Check } from "lucide-react";

export default function SellerDashboard() {
  const navigate = useNavigate();
  const auth = useAuthentication();

  useEffect(() => {
    auth.fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (auth.isLoading) return;

    if (!auth.isAuthenticated) {
      navigate("/login");
      return;
    }

    // Redirect to onboarding if not completed
    if (!auth.currentUser?.stripe_connect_onboarding_completed) {
      navigate("/sell/onboarding");
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Seller Dashboard</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Account Status</h2>
          <div className="flex gap-2 text-green-600">
            <Check />
            <p>
              Your K-Scale seller account is active and ready to receive
              payments.
            </p>
          </div>

          <div className="mt-6">
            <a
              href={`https://dashboard.stripe.com/${auth.currentUser?.stripe_connect_account_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-9 text-white px-6 py-3 rounded-lg hover:bg-primary-9/80 inline-block"
            >
              Open Stripe Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
