import Spinner from "components/ui/Spinner";
import { paths } from "gen/api";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import ListingGridCard from "./ListingGridCard";

type ListingInfo =
  paths["/listings/batch"]["get"]["responses"][200]["content"]["application/json"]["listings"];

interface Props {
  listingIds: string[] | null;
}

const ListingGrid = (props: Props) => {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
      {listingIds.map((listingId) => (
        <ListingGridCard
          key={listingId}
          listingId={listingId}
          listingInfo={listingInfo}
        />
      ))}
    </div>
  );
};

export default ListingGrid;
