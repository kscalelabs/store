import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Buttons/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input, TextArea } from "@/components/ui/Input/Input";
import Spinner from "@/components/ui/Spinner";
import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { format } from "date-fns";

type UserResponse =
  paths["/users/public/me"]["get"]["responses"][200]["content"]["application/json"];

const Account = () => {
  const { addErrorAlert, addAlert } = useAlertQueue();
  const auth = useAuthentication();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      if (auth.currentUser) {
        setUser(auth.currentUser);
        setFirstName(auth.currentUser.first_name || "");
        setLastName(auth.currentUser.last_name || "");
        setBio(auth.currentUser.bio || "");
      } else {
        addErrorAlert("User not authenticated");
      }
    };
    fetchUser();
  }, [auth.currentUser, addErrorAlert]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const { data, error } = await auth.client.PUT("/users/me", {
        body: { first_name: firstName, last_name: lastName, bio },
      });
      if (error) {
        addErrorAlert(error);
      } else {
        setUser({ ...user, ...data });
        addAlert("Profile updated successfully!", "success");
        setIsEditing(false);
      }
    } catch {
      addErrorAlert("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center pt-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="flex flex-col items-center space-y-4">
          <h1 className="text-3xl font-bold">{`${user.first_name || ""} ${user.last_name || ""}`}</h1>
          <p className="text-sm text-gray-11">
            Joined on{" "}
            {user.created_at
              ? format(new Date(user.created_at), "MMMM d, yyyy")
              : "Unknown date"}
          </p>
          {isEditing ? (
            <Button onClick={() => setIsEditing(false)} variant="outline">
              Cancel
            </Button>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Edit Account
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="first_name"
                  className="block text-lg font-medium"
                >
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
              <div className="mb-4">
                <label
                  htmlFor="last_name"
                  className="block text-lg font-medium"
                >
                  Last Name
                </label>
                <Input
                  id="last_name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 block w-full"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="bio" className="block text-lg font-medium">
                  Bio
                </label>
                <TextArea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1 block w-full"
                  rows={4}
                />
              </div>
              {isSubmitting ? (
                <div className="mt-4 flex justify-center items-center">
                  <Spinner />
                </div>
              ) : (
                <div className="mt-4 flex justify-center">
                  <Button type="submit" variant="primary">
                    Save Changes
                  </Button>
                </div>
              )}
            </form>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-2">Bio</h2>
              <p>{user.bio || "No bio set."}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Account;
