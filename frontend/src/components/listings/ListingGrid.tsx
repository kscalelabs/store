import { useEffect, useState } from "react";

import { paths } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import ListingGridCard from "components/listings/ListingGridCard";
import Spinner from "components/ui/Spinner";

type ListingInfo =
  paths["/listings/batch"]["get"]["responses"][200]["content"]["application/json"]["listings"];

interface ListingGridProps {
  listingIds: string[] | null;
}

const ListingGrid = (props: ListingGridProps) => {
  const { listingIds } = props;
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const [listingInfo, setListingInfoResponse] = useState<ListingInfo | null>(
    null,
  );

  useEffect(() => {
    if (listingIds !== null && listingIds.length > 0) {
      (async () => {
        const { data, error } = await auth.client.GET("/listings/batch", {
          params: {
            query: {
              ids: listingIds,
            },
          },
        });

        if (error) {
          addErrorAlert(error);
          return;
        }

        setListingInfoResponse(data.listings);
      })();
    }
  }, [listingIds]);

  return listingIds === null ? (
    <div className="flex justify-center items-center h-64">
      <Spinner />
    </div>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-8 mx-auto">
      {listingIds.map((listingId) => (
        <ListingGridCard
          key={listingId}
          listingId={listingId}
          listing={listingInfo?.find((l) => l.id === listingId)}
        />
      ))}
    </div>
  );
};

export default ListingGrid;
