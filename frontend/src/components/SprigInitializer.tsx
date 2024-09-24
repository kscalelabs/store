import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { useAuthentication } from "@/hooks/useAuth";

const SprigInitializer = () => {
  const location = useLocation();
  const { currentUser, isAuthenticated } = useAuthentication();

  useEffect(() => {
    const initializeSprig = () => {
      if (window.Sprig && typeof window.Sprig === "function") {
        console.log("Sprig initialized");

        // Set user ID if authenticated
        if (isAuthenticated && currentUser) {
          window.Sprig("setUserId", currentUser.id);
        }

        // Track page view
        window.Sprig("track", "page_view", { path: location.pathname });
      } else {
        console.log("Sprig is not ready yet. Retrying...");
        setTimeout(initializeSprig, 500);
      }
    };

    initializeSprig();
  }, [location.pathname, isAuthenticated, currentUser]);

  return null;
};

export default SprigInitializer;
