import { useEffect, useState } from "react";

import Spinner from "@/components/ui/Spinner";
import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

import { RenderProfile } from "./Profile";

type AccountResponse =
  paths["/users/public/me"]["get"]["responses"][200]["content"]["application/json"];

const Account = () => {
  const { addErrorAlert, addAlert } = useAlertQueue();
  const auth = useAuthentication();
  const [user, setUser] = useState<AccountResponse | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [listingIds, setListingIds] = useState<string[] | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const pageNumber = parseInt("1", 10);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      const { data, error } = await auth.client.GET("/users/public/me");
      if (error) {
        addErrorAlert(error);
      } else {
        setUser(data);
        setCanEdit(true);
        setIsAdmin(data.permissions?.includes("is_admin") || false);
      }
      setIsLoading(false);
    };

    const fetchUserListing = async () => {
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
    };

    if (!auth.isLoading) {
      fetchUser();
      fetchUserListing();
    }
  }, [auth.isLoading, auth.client, addErrorAlert]);

  const handleUpdateAccount = async (updatedUser: Partial<AccountResponse>) => {
    try {
      const { data, error } = await auth.client.PUT("/users/me", {
        body: updatedUser,
      });
      if (error) {
        addErrorAlert(error);
      } else {
        setUser({ ...user, ...data } as AccountResponse);
        addAlert("Account updated successfully!", "success");
      }
    } catch {
      addErrorAlert("Failed to update account");
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
      onUpdateProfile={handleUpdateAccount}
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

export default Account;
