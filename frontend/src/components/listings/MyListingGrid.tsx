import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import ListingGridCard from "@/components/listings/ListingGridCard";
import Spinner from "@/components/ui/Spinner";
import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";
import { createListingDetailsMap } from "@/lib/utils/listingUtils";

type ListingInfo = {
  id: string;
  username: string;
  slug: string | null;
};

type ListingDetails =
  paths["/listings/batch"]["get"]["responses"][200]["content"]["application/json"]["listings"][number];

interface MyListingGridProps {
  userId: string;
}

const MyListingGrid = ({ userId }: MyListingGridProps) => {
  const { addErrorAlert } = useAlertQueue();
  const auth = useAuthentication();
  const [listingInfos, setListingInfos] = useState<ListingInfo[] | null>(null);
  const [listingDetails, setListingDetails] = useState<Record<
    string,
    ListingDetails
  > | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      const { data, error } = await auth.client.GET(
        "/listings/user/{user_id}",
        {
          params: { path: { user_id: userId }, query: { page: 1 } },
        },
      );

      if (error) {
        addErrorAlert(error);
        return;
      }

      setListingInfos(data.listings);

      if (data.listings.length > 0) {
        const fetchListingDetails = async (ids: string[]) => {
          const { data, error } = await auth.client.GET("/listings/batch", {
            params: {
              query: {
                ids: ids,
              },
            },
          });

          if (error) {
            addErrorAlert(error);
            return;
          }

          setListingDetails(createListingDetailsMap(data.listings));
        };

        await fetchListingDetails(
          data.listings.map((info: ListingInfo) => info.id),
        );
      }
    };

    fetchListings();
  }, [userId, auth.currentUser?.username]);

  return listingInfos === null ? (
    <div className="flex justify-center items-center min-h-[40vh]">
      <Spinner />
    </div>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 gap-4 sm:gap-6 min-h-[40vh]">
      {listingInfos.map((info) => (
        <Link
          to={ROUTES.BOT.buildPath({
            username: info.username,
            slug: info.slug || info.id,
          })}
          key={info.id}
        >
          <ListingGridCard
            listingId={info.id}
            listing={listingDetails?.[info.id]}
            showDescription={true}
          />
        </Link>
      ))}
    </div>
  );
};

export default MyListingGrid;
