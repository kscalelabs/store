import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { paths } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import Spinner from "components/ui/Spinner";

type UserResponse =
  paths["/users/public/{id}"]["get"]["responses"][200]["content"]["application/json"];

interface RenderProfileProps {
  user: UserResponse;
}

const RenderProfile = (props: RenderProfileProps) => {
  const { user } = props;

  return (
    <div className="container mx-auto max-w-4xl shadow-md rounded-lg bg-white dark:bg-gray-800 dark:text-white border bg-card text-card-foreground relative">
      <div className="p-6">
        <h1 className="text-3xl font-extrabold mb-4">Profile</h1>
        <p>Name: {user.first_name}</p>
        <p>
          Current email:{" "}
          <a className="link" href={`mailto:${user.email}`}>
            {user.email}
          </a>
        </p>
      </div>
    </div>
  );
};

const ProfileDetails = () => {
  const { addErrorAlert } = useAlertQueue();
  const auth = useAuthentication();
  const { id } = useParams();
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (id === undefined) {
        return;
      }

      try {
        const { data, error } = await auth.client.GET("/users/public/{id}", {
          params: {
            path: { id },
          },
        });

        if (error) {
          addErrorAlert(error);
        } else {
          setUser(data as UserResponse); // Ensure correct typing
        }
      } catch (err) {
        addErrorAlert(err);
      }
    };
    fetchUser();
  }, [id]);

  return user && id ? (
    <RenderProfile user={user} />
  ) : (
    <div className="flex justify-center items-center pt-8">
      <Spinner />
    </div>
  );
};

export default ProfileDetails;
