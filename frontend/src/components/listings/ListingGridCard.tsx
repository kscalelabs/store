import clsx from "clsx";
import Image from "components/Image";
import { RenderDescription } from "components/listing/ListingDescription";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/Card";
import { paths } from "gen/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type ListingInfo =
  paths["/listings/batch"]["get"]["responses"][200]["content"]["application/json"]["listings"];

interface Props {
  listingId: string;
  listingInfo: ListingInfo | null;
}

const ListingGridCard = (props: Props) => {
  const { listingId, listingInfo } = props;
  const navigate = useNavigate();
  const [hovering, setHovering] = useState(false);

  const listing = listingInfo?.find((listing) => listing.id === listingId);

  return (
    <Card
      className={clsx(
        "transition-transform duration-100 ease-in-out transform cursor-pointer",
        "flex flex-col max-w-sm rounded material-card bg-white justify-between",
        "dark:bg-gray-900",
        hovering ? "scale-105" : "scale-100",
      )}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={() => navigate(`/item/${listingId}`)}
    >
      {listing?.image_url ? (
        <div className="w-full aspect-square bg-red-500">
          <img
            src={listing.image_url}
            alt={listing.name}
            className="w-full h-full"
          />
        </div>
      ) : (
        <Image />
      )}
      <div className="px-4 py-4 h-full">
        <CardHeader>
          <CardTitle className="text-gray-500 dark:text-gray-300 text-xl min-h-6">
            {listing ? (
              listing.name
            ) : (
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-1/2 mb-2"></div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-gray-500 dark:text-gray-300 max-h-32 overflow-hidden">
          {listing ? (
            listing?.description && (
              <RenderDescription description={listing?.description} />
            )
          ) : (
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-full"></div>
          )}
        </CardContent>
      </div>
    </Card>
  );
};

export default ListingGridCard;
