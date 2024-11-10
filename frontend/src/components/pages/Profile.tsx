import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import MyListingGrid from "@/components/listings/MyListingGrid";
import UpvotedGrid from "@/components/listings/UpvotedGrid";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input, TextArea } from "@/components/ui/Input/Input";
import Spinner from "@/components/ui/Spinner";
import { Tooltip } from "@/components/ui/ToolTip";
import { Button } from "@/components/ui/button";
import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import ROUTES from "@/lib/types/routes";
import { isValidUsername } from "@/lib/utils/validation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { format } from "date-fns";

type UserResponse =
  paths["/users/public/{id}"]["get"]["responses"][200]["content"]["application/json"];

interface RenderProfileProps {
  user: UserResponse;
  onUpdateProfile: (updatedUser: Partial<UserResponse>) => Promise<void>;
  onUpdateUsername: (newUsername: string) => Promise<void>;
  canEdit: boolean;
  listingIds: string[] | null;
  isAdmin: boolean;
}

export const RenderProfile = (props: RenderProfileProps) => {
  const { user, onUpdateProfile, onUpdateUsername, canEdit, isAdmin } = props;
  const navigate = useNavigate();
  const auth = useAuthentication();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstName, setFirstName] = useState(user.first_name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [upvotedPage, setUpvotedPage] = useState(1);
  const [username, setUsername] = useState(user.username || "");
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(true);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameChanged, setIsUsernameChanged] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const { addErrorAlert, addAlert } = useAlertQueue();
  const debouncedUsername = useDebounce(username, 500);

  const formatJoinDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
    return format(date, "MMMM d, yyyy");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      if (isUsernameChanged && isUsernameAvailable) {
        await onUpdateUsername(username);
      }

      await onUpdateProfile({
        first_name: firstName,
        last_name: lastName,
        bio: bio,
      });

      setIsEditing(false);
      setIsUsernameChanged(false);
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetModerator = async () => {
    try {
      await auth.client.POST("/users/set-moderator", {
        body: {
          user_id: user.id,
          is_mod: !user.permissions?.includes("is_mod"),
        },
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to set moderator", error);
    }
  };

  const handleSetContentManager = async () => {
    try {
      const response = await auth.client.POST("/users/set-content-manager", {
        body: {
          user_id: user.id,
          is_content_manager: !user.permissions?.includes("is_content_manager"),
        },
      });

      if (response.error) {
        addErrorAlert({
          message: "Failed to set content manager status",
          detail: response.error,
        });
        return;
      }

      if (response.data) {
        const updatedUser = response.data;
        props.onUpdateProfile(updatedUser);
        addAlert("Content manager status updated successfully!", "success");
      }
    } catch (error) {
      addErrorAlert({
        message: "Failed to set content manager status",
        detail: error,
      });
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === "own") {
      setUpvotedPage(1);
    }
  };

  useEffect(() => {
    const checkUsernameAvailability = async () => {
      if (debouncedUsername && debouncedUsername !== user.username) {
        setIsUsernameChanged(true);
        setIsCheckingUsername(true);
        setUsernameError(null);

        if (!isValidUsername(debouncedUsername)) {
          setIsUsernameAvailable(false);
          setUsernameError(
            "Username can only contain letters, numbers, underscores, and hyphens.",
          );
          setIsCheckingUsername(false);
          return;
        }

        try {
          const { data, error } = await auth.client.GET(
            "/users/check-username/{username}",
            {
              params: { path: { username: debouncedUsername } },
            },
          );
          if (error) {
            console.error("Error checking username availability:", error);
            setIsUsernameAvailable(false);
          } else {
            setIsUsernameAvailable(data?.available ?? false);
          }
        } catch (error) {
          console.error("Error checking username availability:", error);
          setIsUsernameAvailable(false);
        } finally {
          setIsCheckingUsername(false);
        }
      } else {
        setIsUsernameAvailable(true);
        setIsCheckingUsername(false);
        setIsUsernameChanged(false);
        setUsernameError(null);
      }
    };

    checkUsernameAvailability();
  }, [debouncedUsername, user.username, auth.client]);

  const getRoleName = (permissions: string[]) => {
    switch (true) {
      case permissions.includes("is_admin"):
        return "Admin";
      case permissions.includes("is_mod"):
        return "Moderator";
      case permissions.includes("is_content_manager"):
        return "Content Manager";
      default:
        return "Member";
    }
  };

  return (
    <div className="space-y-8 mb-12">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="flex flex-col items-center space-y-4">
          <div className="flex flex-col items-center space-y-2">
            <h1 className="text-3xl font-bold text-primary-9">
              {user.first_name || user.last_name
                ? `${user.first_name || ""} ${user.last_name || ""}`
                : "Anonymous Creator"}
            </h1>
            <div className="flex gap-2">
              <p className="text-sm text-gray-1 bg-gray-10 px-3 py-1 rounded-md">
                <span className="font-semibold mr-0.5 select-none">@</span>
                {user.username}
              </p>
              {user.permissions && (
                <p className="text-sm text-primary-9 bg-primary-3 px-3 py-1 rounded-md">
                  {getRoleName(user.permissions)}
                </p>
              )}
            </div>
            <p className="text-sm text-gray-11">
              Joined on{" "}
              {user.created_at
                ? formatJoinDate(user.created_at)
                : "Unknown date"}
            </p>
          </div>
          {!isEditing && canEdit && (
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                onClick={() => navigate(ROUTES.KEYS.path)}
                variant="primary"
              >
                API Keys
              </Button>
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Edit Profile
              </Button>
            </div>
          )}
          {isAdmin && !canEdit && (
            <div className="flex space-x-2">
              <Button onClick={handleSetModerator} variant="outline">
                {user.permissions?.includes("is_mod")
                  ? "Remove Moderator"
                  : "Set as Moderator"}
              </Button>
              <Button onClick={handleSetContentManager} variant="outline">
                {user.permissions?.includes("is_content_manager")
                  ? "Remove Content Manager"
                  : "Set as Content Manager"}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="flex justify-center space-y-4">
              <form
                onSubmit={handleSubmit}
                className="w-full max-w-lg space-y-4"
              >
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Username
                  </label>
                  <p className="text-xs text-gray-10 italic">
                    Changing your username will change the URL for all your
                    posted listings.
                  </p>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full"
                  />
                  {isCheckingUsername && (
                    <p className="text-sm text-gray-500">
                      Checking username...
                    </p>
                  )}
                  {!isCheckingUsername && isUsernameChanged && (
                    <p
                      className={`text-sm ${
                        isUsernameAvailable && !usernameError
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {usernameError ||
                        (isUsernameAvailable
                          ? "Username is available"
                          : "Username is not available")}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
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

                  <div>
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
                </div>

                <div>
                  <label htmlFor="bio" className="block text-lg font-medium">
                    Bio
                  </label>
                  <TextArea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-11 shadow-sm focus:border-primary-9 focus:ring focus:ring-primary-9 focus:ring-opacity-50"
                    rows={3}
                  />
                </div>

                {isSubmitting ? (
                  <div className="mt-4 flex justify-center items-center">
                    <Spinner />
                  </div>
                ) : (
                  <div className="mt-4 flex justify-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isUsernameChanged && !isUsernameAvailable}
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                {user.bio ? (
                  <p>{user.bio}</p>
                ) : (
                  <p className="text-gray-11 text-sm">
                    No bio set. Edit your profile to add a bio.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <h2 className="text-2xl font-bold">Store</h2>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            {user.stripe_connect_account_id &&
            !user.stripe_connect_onboarding_completed ? (
              <p className="text-gray-11 text-sm">
                Your Stripe account setup is not complete. Please resolve
                outstanding requirements to begin selling robots. It may take
                some time for Stripe to process your info between submissions.
              </p>
            ) : user.stripe_connect_onboarding_completed ? (
              <p className="text-gray-11 text-sm">
                Stripe account setup complete.
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(ROUTES.ORDERS.path)}
              variant="primary"
            >
              Orders
            </Button>
            {!user.stripe_connect_account_id ? (
              <Tooltip content="Start seller onboarding" position="bottom">
                <Button
                  onClick={() => navigate(ROUTES.SELL.ONBOARDING.path)}
                  variant="outline"
                >
                  Sell Robots
                </Button>
              </Tooltip>
            ) : !user.stripe_connect_onboarding_completed ? (
              <Tooltip content="Continue seller onboarding" position="bottom">
                <Button
                  onClick={() => navigate(ROUTES.SELL.ONBOARDING.path)}
                  variant="outline"
                >
                  Complete Seller Setup
                </Button>
              </Tooltip>
            ) : (
              <Button
                onClick={() => navigate(ROUTES.SELL.path)}
                variant="outline"
              >
                Seller Dashboard
              </Button>
            )}
          </div>
          <div className="flex flex-col items-center space-y-4">
            <Tabs
              defaultValue="own"
              className="w-full"
              onValueChange={handleTabChange}
            >
              <TabsList className="flex justify-center space-x-4 mb-4">
                <TabsTrigger
                  value="own"
                  className="text-sm px-3 py-1.5 rounded-md transition-colors duration-300 hover:bg-gray-9 hover:text-gray-1 data-[state=active]:bg-gray-12 data-[state=active]:text-gray-1"
                >
                  Your Listings
                </TabsTrigger>
                <TabsTrigger
                  value="upvoted"
                  className="text-sm px-3 py-1.5 rounded-md transition-colors duration-300 hover:bg-gray-9 hover:text-gray-1 data-[state=active]:bg-gray-12 data-[state=active]:text-gray-1"
                >
                  Upvoted
                </TabsTrigger>
              </TabsList>
              <TabsContent value="own">
                <MyListingGrid userId={user.id} />
              </TabsContent>
              <TabsContent value="upvoted">
                <UpvotedGrid page={upvotedPage} setPage={setUpvotedPage} />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Profile = () => {
  const { addErrorAlert, addAlert } = useAlertQueue();
  const auth = useAuthentication();
  const { id } = useTypedParams(ROUTES.PROFILE);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [listingIds, setListingIds] = useState<string[] | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const pageNumber = parseInt("1", 10);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      if (id === undefined) {
        if (auth.currentUser) {
          setUser(auth.currentUser);
          setCanEdit(true);
          setIsAdmin(
            auth.currentUser.permissions?.includes("is_admin") || false,
          );
          setIsLoading(false);
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
            setCanEdit(auth.currentUser?.id === data.id);
            setIsAdmin(
              auth.currentUser?.permissions?.includes("is_admin") || false,
            );
          }
          setIsLoading(false);
        } catch (err) {
          addErrorAlert(err);
          setIsLoading(false);
        }
      }
    };
    const fetchUserListing = async () => {
      if (id !== undefined) {
        try {
          const { data, error } = await auth.client.GET(
            "/listings/user/{user_id}",
            {
              params: {
                path: { user_id: id },
                query: {
                  page: pageNumber,
                },
              },
            },
          );

          if (error) {
            addErrorAlert(error);
          } else {
            setListingIds(data.listings.map((listing) => listing.id));
          }
        } catch (err) {
          console.error("Failed to fetch User Listings", err);
        }
      }
    };

    if (!auth.isLoading) {
      fetchUser();
      fetchUserListing();
    }
  }, [id, auth.currentUser, auth.isLoading, auth.client, addErrorAlert]);

  const handleUpdateProfile = async (updatedUser: Partial<UserResponse>) => {
    try {
      const { data, error } = await auth.client.PUT("/users/me", {
        body: updatedUser,
      });
      if (error) {
        addErrorAlert(error);
      } else {
        setUser({ ...user, ...data } as UserResponse);
        addAlert("Profile updated successfully!", "success");
      }
    } catch {
      addErrorAlert("Failed to update profile");
    }
  };

  const handleUpdateUsername = async (newUsername: string) => {
    try {
      const { data, error } = await auth.client.PUT("/users/me/username", {
        body: { new_username: newUsername },
      });
      if (error) {
        addErrorAlert(error);
      } else {
        setUser({ ...user, username: data.username } as UserResponse);
        addAlert("Username updated successfully!", "success");
      }
    } catch {
      addErrorAlert("Failed to update username");
    }
  };

  if (auth.isLoading || isLoading) {
    return (
      <div className="flex justify-center items-center pt-8">
        <Spinner />
      </div>
    );
  }

  return user ? (
    <RenderProfile
      user={user}
      onUpdateProfile={handleUpdateProfile}
      onUpdateUsername={handleUpdateUsername}
      canEdit={canEdit}
      listingIds={listingIds}
      isAdmin={isAdmin}
    />
  ) : (
    <div className="flex justify-center items-center pt-8">
      <p>User not found</p>
    </div>
  );
};

export default Profile;
