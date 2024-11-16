import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import ListingGridCard from "@/components/listings/ListingGridCard";
import Spinner from "@/components/ui/Spinner";
import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";
import { createListingDetailsMap } from "@/lib/utils/listingUtils";

import { Button } from "../ui/button";

type ListingInfo =
  paths["/listings/upvotes"]["get"]["responses"][200]["content"]["application/json"]["listings"][number];

type ListingDetails =
  paths["/listings/batch"]["get"]["responses"][200]["content"]["application/json"]["listings"][number];

interface UpvotedGridProps {
  page: number;
  setPage: (page: number) => void;
}

const UpvotedGrid = ({ page, setPage }: UpvotedGridProps) => {
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();
  const navigate = useNavigate();

  const [listingInfos, setListingInfos] = useState<ListingInfo[] | null>(null);
  const [listingDetails, setListingDetails] = useState<Record<
    string,
    ListingDetails
  > | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);

  useEffect(() => {
    fetchUpvotedListings();
  }, [page]);

  const fetchUpvotedListings = async () => {
    setListingInfos(null);
    setListingDetails(null);

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

    setListingInfos(data.listings);
    setHasMore(data.has_next);

    if (data.listings.length > 0) {
      fetchListingDetails(data.listings.map((info: ListingInfo) => info.id));
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

    setListingDetails(createListingDetailsMap(data.listings));
  };

  const prevButton = page > 1;
  const nextButton = hasMore;

  return listingInfos === null ? (
    <div className="flex justify-center items-center min-h-[40vh]">
      <Spinner />
    </div>
  ) : listingInfos.length > 0 ? (
    <div className="min-h-[40vh]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {listingInfos.map((info) => (
          <Link
            to={ROUTES.BOT.buildPath({
              username: info.username || "unknown",
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
    <div className="flex flex-col justify-center items-center min-h-[40vh] gap-4">
      <p>You have not upvoted any bots</p>
      <Button
        variant="outline"
        onClick={() => navigate(ROUTES.BOTS.BROWSE.path)}
      >
        Browse Robots
      </Button>
    </div>
  );
};

export default UpvotedGrid;
