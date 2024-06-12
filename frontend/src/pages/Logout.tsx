import { api } from "hooks/api";
import { deleteLocalStorageAuth, useAuthentication } from "hooks/auth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  useEffect(() => {
    (async () => {
      deleteLocalStorageAuth();
      try {
        await auth_api.logout();
      } catch (err) {
        console.error(err);
      }
      navigate("/");
    })();
  }, [auth_api, navigate]);
  return <></>;
};
export default Logout;
