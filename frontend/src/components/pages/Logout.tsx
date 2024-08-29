import { useEffect } from "react";

import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import { Card, CardContent, CardHeader } from "components/ui/Card";
import Header from "components/ui/Header";
import Spinner from "components/ui/Spinner";

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
    <div className="mx-8">
      <div className="flex justify-center items-center">
        <Card className="w-[400px] shadow-md bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg">
          <CardHeader>
            <Header title="Logout" />
          </CardHeader>
          <CardContent className="flex justify-center">
            <Spinner />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default Logout;
