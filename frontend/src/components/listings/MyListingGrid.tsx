import { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Link } from "react-router-dom";

import ListingGridCard from "@/components/listings/ListingGridCard";
import Spinner from "@/components/ui/Spinner";
import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

type ListingInfo =
  paths["/listings/batch"]["get"]["responses"][200]["content"]["application/json"]["listings"][number];

interface MyListingGridProps {
  page: number;
  setPage: (page: number) => void;
}

const MyListingGrid = ({ page, setPage }: MyListingGridProps) => {
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [listingInfo, setListingInfo] = useState<ListingInfo[] | null>(null);

  useEffect(() => {
    fetchUserListings();
  }, [page]);

  const fetchUserListings = async () => {
    setIsLoading(true);
    setListingInfo(null);

    const { data, error } = await auth.client.GET("/listings/me", {
      params: {
        query: {
          page: page,
        },
      },
    });

    if (error) {
      addErrorAlert(error);
    } else {
      setHasMore(data.has_next);
      fetchListings(data.listing_ids);
    }
  };

  const fetchListings = async (ids: string[]) => {
    if (ids.length === 0) {
      setListingInfo([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await auth.client.GET("/listings/batch", {
      params: {
        query: {
          ids: ids,
        },
      },
    });

    if (error) {
      addErrorAlert(error);
    } else {
      setListingInfo(data.listings);
    }
    setIsLoading(false);
  };

  const prevButton = page > 1;
  const nextButton = hasMore;

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      ) : (
        <>
          {listingInfo && listingInfo.length > 0 ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {listingInfo.map((listing) => (
                  <Link to={`/item/${listing.id}`} key={listing.id}>
                    <ListingGridCard
                      listingId={listing.id}
                      listing={listing}
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
                  <FaChevronLeft className="text-xs mr-2" />
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
                  <FaChevronRight className="text-xs ml-2" />
                </button>
              </div>
            </div>
          ) : (
            <p className="flex justify-center items-center h-64">
              You have not created any listings
            </p>
          )}
        </>
      )}
    </>
  );
};

export default MyListingGrid;
