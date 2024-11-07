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
          // Set user ID and email in Sprig if user is authenticated
          if (isAuthenticated && currentUser) {
            window.Sprig("setUserId", currentUser.id);
            window.Sprig("setEmail", currentUser.email);
          }

          // Track page view
          window.Sprig("track", "page_view", { path: location.pathname });
        } else {
          setTimeout(initializeSprig, 500);
        }
      };

      initializeSprig();
    }
  }, [location.pathname, isAuthenticated, currentUser]);

  return null;
};

export default SprigInitializer;
