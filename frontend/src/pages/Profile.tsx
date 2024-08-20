import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { paths } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import { Button } from "components/ui/Button/Button";
import { Input } from "components/ui/Input/Input";
import Spinner from "components/ui/Spinner";

type UserResponse =
  paths["/users/public/{id}"]["get"]["responses"][200]["content"]["application/json"];

interface RenderProfileProps {
  user: UserResponse;
  onUpdateProfile: (updatedUser: Partial<UserResponse>) => Promise<void>;
}

const RenderProfile = (props: RenderProfileProps) => {
  const { user, onUpdateProfile } = props;
  const [firstName, setFirstName] = useState(user.first_name || "");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await onUpdateProfile({
        first_name: firstName,
      });
    } catch (error) {
      console.error("Failed to update profile", error);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl shadow-md rounded-lg bg-white dark:bg-gray-800 dark:text-white border bg-card text-card-foreground relative">
      <div className="p-6">
        <h1 className="text-3xl font-extrabold mb-4">Profile</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="first_name" className="block text-lg font-medium">
              First Name
            </label>
            <Input
              id="first_name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 block w-full"
            />
          </div>

          <Button type="submit" variant="primary">
            Update Profile
          </Button>
        </form>
      </div>
    </div>
  );
};

const ProfileDetails = () => {
  const { addErrorAlert, addAlert } = useAlertQueue();
  const auth = useAuthentication();
  const { id } = useParams();
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (id === undefined) {
        const { data, error } = await auth.client.GET("/users/public/me");

        if (error) {
          addErrorAlert(error);
        } else {
          setUser(data);
        }
      } else {
        try {
          const { data, error } = await auth.client.GET("/users/public/{id}", {
            params: {
              path: { id },
            },
          });

          if (error) {
            addErrorAlert(error);
          } else {
            setUser(data);
          }
        } catch (err) {
          addErrorAlert(err);
        }
      }
    };
    fetchUser();
  }, [id]);

  const handleUpdateProfile = async (updatedUser: Partial<UserResponse>) => {
    try {
      const { error } = await auth.client.PUT("/users/me", {
        body: updatedUser,
      });
      if (error) {
        addErrorAlert(error);
      } else {
        setUser({ ...user, ...updatedUser });
        addAlert("Profile updated successfully!", "success");
      }
    } catch {
      addErrorAlert("Failed to update profile");
    }
  };

  return user ? (
    <RenderProfile user={user} onUpdateProfile={handleUpdateProfile} />
  ) : (
    <div className="flex justify-center items-center pt-8">
      <Spinner />
    </div>
  );
};

export default ProfileDetails;
