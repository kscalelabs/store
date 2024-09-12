import { useEffect } from "react";

import Header from "@/components/ui/Header";
import Spinner from "@/components/ui/Spinner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

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
        <Card className="w-[400px] shadow-md bg-gray-2 text-gray-12 rounded-lg">
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
