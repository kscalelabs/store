import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import ListingGridCard from "@/components/listings/ListingGridCard";
import Spinner from "@/components/ui/Spinner";
import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

type ListingInfo =
  paths["/listings/batch"]["get"]["responses"][200]["content"]["application/json"]["listings"];

interface UpvotedGridProps {
  page: number;
  setPage: (page: number) => void;
}

const UpvotedGrid = ({ page, setPage }: UpvotedGridProps) => {
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const [listingIds, setListingIds] = useState<string[] | null>(null);
  const [listingInfo, setListingInfo] = useState<ListingInfo | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);

  useEffect(() => {
    fetchUpvotedListings();
  }, [page]);

  const fetchUpvotedListings = async () => {
    setListingIds(null);
    setListingInfo(null);

    const { data, error } = await auth.client.GET("/listings/upvotes", {
      params: {
        query: {
          page: page,
        },
      },
    });

    if (error) {
      addErrorAlert(error);
      return;
    }

    setListingIds(data.upvoted_listing_ids);
    setHasMore(data.has_more);

    if (data.upvoted_listing_ids.length > 0) {
      fetchListingDetails(data.upvoted_listing_ids);
    }
  };

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

    setListingInfo(data.listings);
  };

  const prevButton = page > 1;
  const nextButton = hasMore;

  return listingIds === null ? (
    <div className="flex justify-center items-center h-64">
      <Spinner />
    </div>
  ) : listingIds.length > 0 ? (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {listingIds.map((listingId) => (
          <Link to={`/item/${listingId}`} key={listingId}>
            <ListingGridCard
              listingId={listingId}
              listing={listingInfo?.find((l) => l.id === listingId)}
              showDescription={true}
            />
          </Link>
        ))}
      </div>
      <div className="flex justify-between mt-6">
        <button
          className={`px-4 py-2 rounded flex items-center justify-center ${prevButton ? "bg-gray-12 text-white" : "bg-gray-7 text-gray-12 cursor-not-allowed"}`}
          onClick={() => {
            if (prevButton) {
              setPage(page - 1);
            }
          }}
          disabled={!prevButton}
        >
          <span>Previous</span>
        </button>
        <button
          className={`px-4 py-2 rounded flex items-center justify-center ${nextButton ? "bg-gray-12 text-white" : "bg-gray-7 text-gray-12 cursor-not-allowed"}`}
          onClick={() => {
            if (nextButton) {
              setPage(page + 1);
            }
          }}
          disabled={!nextButton}
        >
          <span>Next</span>
        </button>
      </div>
    </div>
  ) : (
    <p className="flex justify-center items-center h-64">
      You have not upvoted any listings
    </p>
  );
};

export default UpvotedGrid;
