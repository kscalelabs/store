import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { useAuthentication } from "@/hooks/useAuth";

const SprigInitializer = () => {
  const location = useLocation();
  const { currentUser, isAuthenticated } = useAuthentication();

  useEffect(() => {
    const sprigConsent = localStorage.getItem("sprig-consent") === "true";

    if (sprigConsent) {
      const initializeSprig = () => {
        if (window.Sprig && typeof window.Sprig === "function") {
          console.log("Sprig initialized");

          // Set user ID and email in Sprig if user is authenticated
          if (isAuthenticated && currentUser) {
            window.Sprig("setUserId", currentUser.id);
            window.Sprig("setUserEmail", currentUser.email);
          }

          // Track page view
          window.Sprig("track", "page_view", { path: location.pathname });
        } else {
          console.log("Sprig is not ready yet. Retrying...");
          setTimeout(initializeSprig, 500);
        }
      };

      initializeSprig();
    } else {
      console.log("Sprig tracking is disabled due to user preferences.");
    }
  }, [location.pathname, isAuthenticated, currentUser]);

  return null;
};

export default SprigInitializer;
