import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import ListingGridCard from "@/components/listings/ListingGridCard";
import Spinner from "@/components/ui/Spinner";
import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";
import { createListingDetailsMap } from "@/lib/utils/listingUtils";

import ListingGridSkeleton from "./ListingGridSkeleton";

type ListingInfo = {
  id: string;
  username: string;
  slug: string | null;
};

type ListingDetails =
  paths["/listings/batch"]["get"]["responses"][200]["content"]["application/json"]["listings"][number];

interface ListingGridProps {
  listingInfos: ListingInfo[] | null;
}

const ListingGrid = (props: ListingGridProps) => {
  const { listingInfos } = props;
  const { addErrorAlert } = useAlertQueue();
  const auth = useAuthentication();

  const [listingDetails, setListingDetails] = useState<Record<
    string,
    ListingDetails
  > | null>(null);

  useEffect(() => {
    if (listingInfos !== null && listingInfos.length > 0) {
      (async () => {
        const { data, error } = await auth.client.GET("/listings/batch", {
          params: {
            query: {
              ids: listingInfos.map((info) => info.id),
            },
          },
        });

        if (error) {
          addErrorAlert(error);
          return;
        }

        setListingDetails(createListingDetailsMap(data.listings));
      })();
    }
  }, [listingInfos]);

  return listingInfos === null ? (
    <div className="flex justify-center items-center h-64">
      <Spinner />
    </div>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {listingInfos.map((info) => (
        <Link
          to={ROUTES.BOT.buildPath({
            username: info.username,
            slug: info.slug || info.id,
          })}
          key={`${info.username}-${info.id}`}
        >
          {listingDetails === null ? (
            <ListingGridSkeleton />
          ) : (
            <ListingGridCard
              listingId={info.id}
              listing={listingDetails[info.id]}
              showDescription={true}
            />
          )}
        </Link>
      ))}
    </div>
  );
};

export default ListingGrid;
