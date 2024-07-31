import { humanReadableError } from "constants/backend";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useEffect } from "react";
import { Spinner } from "react-bootstrap";

const Logout = () => {
  const auth = useAuthentication();
  const { addAlert } = useAlertQueue();

  useEffect(() => {
    (async () => {
      const { error } = await auth.client.DELETE("/users/logout");
      if (error) {
        addAlert(humanReadableError(error), "error");
      } else {
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
