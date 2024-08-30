import { useState } from "react";
import { FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import clsx from "clsx";
import { paths } from "gen/api";
import { formatNumber } from "utils/formatNumber";
import { formatTimeSince } from "utils/formatTimeSince";

import ImagePlaceholder from "components/ImagePlaceholder";
import ListingVoteButtons from "components/listing/ListingVoteButtons";
import { Card, CardFooter, CardHeader, CardTitle } from "components/ui/Card";

type ListingInfo =
  paths["/listings/batch"]["get"]["responses"][200]["content"]["application/json"]["listings"][0];

interface Props {
  listingId: string;
  listing: ListingInfo | undefined;
}

const ListingGridCard = ({ listingId, listing }: Props) => {
  const navigate = useNavigate();
  const [hovering, setHovering] = useState(false);

  return (
    <Card
      className={clsx(
        "transition-all duration-100 ease-in-out cursor-pointer",
        "flex flex-col rounded material-card bg-white justify-between",
        "dark:bg-gray-900",
        "relative overflow-hidden",
      )}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={() => navigate(`/item/${listingId}`)}
    >
      {/* Hover overlay */}
      <div
        className={clsx(
          "absolute inset-0 transition-opacity duration-100 ease-in-out",
          "bg-black dark:bg-white",
          hovering ? "opacity-10" : "opacity-0",
        )}
      />

      {listing?.image_url ? (
        <div className="w-full aspect-square bg-white">
          <img
            src={listing.image_url}
            alt={listing.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <ImagePlaceholder />
      )}
      <div className="flex flex-col flex-grow p-4">
        <CardHeader className="p-0 mb-2">
          <CardTitle className="text-gray-800 dark:text-gray-200 text-lg font-semibold truncate">
            {listing ? (
              listing.name
            ) : (
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-1/2 mb-2"></div>
            )}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex flex-col items-start p-0 mt-auto">
          {listing && (
            <>
              <div className="flex items-center text-sm text-gray-400 mb-1">
                <FaEye className="mr-1" />
                <span>{formatNumber(listing.views || 0)}</span>
              </div>
              <div className="text-xs text-gray-500">
                {formatTimeSince(new Date(listing.created_at * 1000))}
              </div>
            </>
          )}
        </CardFooter>
      </div>
      {listing && (
        <div className="absolute top-2 left-2 z-10">
          <ListingVoteButtons
            listingId={listingId}
            initialScore={listing.score ?? 0}
            initialUserVote={listing.user_vote ?? null}
          />
        </div>
      )}
    </Card>
  );
};

export default ListingGridCard;
