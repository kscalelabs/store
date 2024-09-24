import { useEffect, useState } from "react";
import Masonry from "react-masonry-css";
import { Link } from "react-router-dom";

import ListingGridCard from "@/components/listings/ListingGridCard";
import { Card } from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

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

  const breakpointColumnsObj = {
    default: 4,
    1536: 3,
    1280: 3,
    1024: 2,
    768: 2,
    640: 1,
  };

  return listingIds === null ? (
    <div className="flex justify-center items-center h-64">
      <Spinner />
    </div>
  ) : (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="flex w-auto -ml-4 sm:-ml-6"
      columnClassName="pl-4 sm:pl-6 bg-clip-padding"
    >
      {listingIds.map((listingId) => (
        <Card key={listingId} className="mb-4 sm:mb-6 overflow-hidden">
          <Link to={`/item/${listingId}`}>
            <ListingGridCard
              listingId={listingId}
              listing={listingInfo?.find((l) => l.id === listingId)}
              showDescription={true}
            />
          </Link>
        </Card>
      ))}
    </Masonry>
  );
};

export default ListingGrid;
