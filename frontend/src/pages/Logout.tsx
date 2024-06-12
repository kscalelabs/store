import { api } from "hooks/api";
import { deleteLocalStorageAuth, useAuthentication } from "hooks/auth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  useEffect(() => {
    deleteLocalStorageAuth();
    auth_api.logout();
    navigate("/");
  }, [auth_api, navigate]);
  return <></>;
};
export default Logout;
