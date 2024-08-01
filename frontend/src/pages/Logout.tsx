import Spinner from "components/ui/Spinner";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useEffect } from "react";

const Logout = () => {
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  useEffect(() => {
    (async () => {
      const { error } = await auth.client.DELETE("/users/logout");
      if (error) {
        addErrorAlert(error);
      } else {
        auth.logout();
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="mb-4">Log Out</h1>
      <Spinner />
    </div>
  );
};
export default Logout;
