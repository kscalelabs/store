import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SprigInitializer = () => {
  const location = useLocation();

  useEffect(() => {
    const checkSprig = () => {
      if (window.Sprig && typeof window.Sprig === "function") {
        console.log("Sprig initialized");
        window.Sprig("track", "page_view", { path: location.pathname });
      } else {
        console.log("Sprig is not ready yet. Retrying...");
        setTimeout(checkSprig, 500);
      }
    };

    checkSprig();
  }, [location.pathname]);

  return null;
};

export default SprigInitializer;
