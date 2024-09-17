import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const PendoInitializer = () => {
  const location = useLocation();

  useEffect(() => {
    if (window.pendo) {
      window.pendo.initialize({
        visitor: { id: "" },
        account: { id: "" },
      });
    }
  }, []);

  useEffect(() => {
    if (window.pendo) {
      window.pendo.pageLoad();
    }
  }, [location.pathname]);

  return null;
};

export default PendoInitializer;
