import { humanReadableError } from "constants/backend";
import { useAlertQueue } from "hooks/alerts";
import { api } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { useEffect } from "react";
import { Spinner } from "react-bootstrap";

const Logout = () => {
  const auth = useAuthentication();
  const { addAlert } = useAlertQueue();
  const auth_api = new api(auth.api);

  useEffect(() => {
    (async () => {
      try {
        await auth_api.logout();
      } catch (err) {
        addAlert(humanReadableError(err), "error");
      } finally {
        auth.logout();
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="mb-4">Log Out</h1>
      <Spinner animation="border" />
    </div>
  );
};
export default Logout;
