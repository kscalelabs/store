import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import ListingGrid from "@/components/listings/ListingGrid";
import { Button } from "@/components/ui/Buttons/Button";
import { Input, TextArea } from "@/components/ui/Input/Input";
import Spinner from "@/components/ui/Spinner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { format } from "date-fns";

type UserResponse =
  paths["/users/public/{id}"]["get"]["responses"][200]["content"]["application/json"];

interface RenderProfileProps {
  user: UserResponse;
  onUpdateProfile: (updatedUser: Partial<UserResponse>) => Promise<void>;
  canEdit: boolean;
  listingIds: string[] | null;
}

const RenderProfile = (props: RenderProfileProps) => {
  const { user, onUpdateProfile, canEdit, listingIds } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstName, setFirstName] = useState(user.first_name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const [bio, setBio] = useState(user.bio || "");

  const formatJoinDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
    return format(date, "MMMM d, yyyy");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdateProfile({
        first_name: firstName,
        last_name: lastName,
        bio: bio,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="flex flex-col items-center space-y-4">
          <h1 className="text-3xl font-bold">
            {user.first_name || user.last_name
              ? `${user.first_name || ""} ${user.last_name || ""}`
              : "No name set"}
          </h1>
          <p className="text-sm text-gray-11">
            Joined on{" "}
            {user.created_at ? formatJoinDate(user.created_at) : "Unknown date"}
          </p>
          {!isEditing && canEdit && (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Edit Profile
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
                  className="mt-1 block w-full rounded-md border-gray-11 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  rows={4}
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
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Save Changes
                  </Button>
                </div>
              )}
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Bio</h2>
                {user.bio ? (
                  <p>{user.bio}</p>
                ) : (
                  <p className="text-gray-11">
                    No bio set. Edit your profile to add a bio.
                  </p>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Contact</h2>
                <p>Email: {user.email || "No email set"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <h2 className="text-2xl font-bold">Listings</h2>
        </CardHeader>
        <CardContent>
          {listingIds && <ListingGrid listingIds={listingIds} />}
        </CardContent>
      </Card>
    </div>
  );
};

const Profile = () => {
  const { addErrorAlert, addAlert } = useAlertQueue();
  const auth = useAuthentication();
  const { id } = useParams();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [listingIds, setListingIds] = useState<string[] | null>(null);

  const pageNumber = parseInt("1", 10);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      if (id === undefined) {
        if (auth.currentUser) {
          setUser(auth.currentUser);
          setCanEdit(true);
          setIsLoading(false);
        } else if (!auth.isLoading) {
          const { data, error } = await auth.client.GET("/users/public/me");
          if (error) {
            addErrorAlert(error);
          } else {
            setUser(data);
            setCanEdit(true);
          }
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
          }
          setIsLoading(false);
        } catch (err) {
          addErrorAlert(err);
          setIsLoading(false);
        }
      }
    };
    const fetchUserListing = async () => {
      if (id === undefined) {
        const { data, error } = await auth.client.GET("/listings/me", {
          params: {
            query: {
              page: pageNumber,
            },
          },
        });

        if (error) {
          addErrorAlert(error);
        } else {
          setListingIds(data.listing_ids);
        }
      } else {
        try {
          const { data, error } = await auth.client.GET("/listings/user/{id}", {
            params: {
              path: { id },
              query: {
                page: pageNumber,
              },
            },
          });

          if (error) {
            addErrorAlert(error);
          } else {
            setListingIds(data.listing_ids);
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

  if (auth.isLoading || isLoading) {
    return (
      <div className="flex justify-center items-center pt-8">
        <Spinner />
      </div>
    );
  }

  return user ? (
    <>
      <RenderProfile
        user={user}
        onUpdateProfile={handleUpdateProfile}
        canEdit={canEdit}
        listingIds={listingIds}
      />
      {listingIds && (
        <div className="mt-4">
          <ListingGrid listingIds={listingIds} />
        </div>
      )}
    </>
  ) : (
    <div className="flex justify-center items-center pt-8">
      <p>User not found</p>
    </div>
  );
};

export default Profile;
