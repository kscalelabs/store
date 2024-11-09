import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";

export default function DeleteConnect() {
  const navigate = useNavigate();
  const auth = useAuthentication();
  const { addErrorAlert, addAlert } = useAlertQueue();

  useEffect(() => {
    if (auth.isLoading) return;

    if (!auth.isAuthenticated) {
      navigate(ROUTES.LOGIN.path);
      return;
    }

    if (!auth.currentUser?.permissions?.includes("is_admin")) {
      navigate(ROUTES.HOME.path);
      return;
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  const handleDeleteTestAccounts = async () => {
    try {
      const { data, error } = await auth.client.POST(
        "/stripe/connect/delete/accounts",
        {},
      );

      if (error) {
        addErrorAlert(error);
        return;
      }

      addAlert(`Successfully deleted ${data.count} test accounts`, "success");
      setTimeout(() => {
        navigate(ROUTES.SELL.ONBOARDING.path);
      }, 2000);
    } catch (error) {
      addErrorAlert(`Failed to delete test accounts: ${error}`);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          Delete Test Connect Accounts
        </h1>

        <div className="bg-red-50 p-6 rounded-lg mb-6">
          <h2 className="text-red-800 font-semibold mb-2">⚠️ Warning</h2>
          <p className="text-red-700 mb-4">
            This action will delete all test Stripe Connect accounts associated
            with this environment. This operation cannot be undone.
          </p>
        </div>

        <button
          onClick={handleDeleteTestAccounts}
          className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
        >
          Delete All Test Connect Accounts
        </button>
      </div>
    </div>
  );
}
