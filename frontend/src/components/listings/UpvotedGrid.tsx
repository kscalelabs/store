import { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import ListingGridCard from "@/components/listings/ListingGridCard";
import Spinner from "@/components/ui/Spinner";
import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

type ListingInfo =
  paths["/listings/batch"]["get"]["responses"][200]["content"]["application/json"]["listings"][number];

const UpvotedGrid = () => {
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = searchParams.get("page");
  const pageNumber = parseInt(page || "1", 10);
  if (isNaN(pageNumber) || pageNumber < 1) {
    navigate("/404");
  }

  const [listingIds, setListingIds] = useState<string[] | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [listingInfo, setListingInfo] = useState<ListingInfo[] | null>(null);

  useEffect(() => {
    fetchUpvotedListings();
  }, [pageNumber]);

  const fetchUpvotedListings = async () => {
    setIsLoading(true);
    setListingIds(null);
    setListingInfo(null);

    const { data, error } = await auth.client.GET("/listings/upvotes", {
      params: {
        query: {
          page: pageNumber,
        },
      },
    });
    if (error) {
      addErrorAlert(error);
    } else {
      setListingIds(data.upvoted_listing_ids);
      setHasMore(data.has_more);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (listingIds && listingIds.length > 0) {
      fetchListingDetails();
    }
  }, [listingIds]);

  const fetchListingDetails = async () => {
    if (!listingIds) {
      return;
    }

    const { data, error } = await auth.client.GET("/listings/batch", {
      params: {
        query: {
          ids: listingIds,
        },
      },
    });

    if (error) {
      addErrorAlert(error);
    } else {
      setListingInfo(data.listings);
    }
  };

  const prevButton = pageNumber > 1;
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
                      setSearchParams({ page: (pageNumber - 1).toString() });
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
                      setSearchParams({ page: (pageNumber + 1).toString() });
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
            <p>You have not upvoted any listings</p>
          )}
        </>
      )}
    </>
  );
};

export default UpvotedGrid;
