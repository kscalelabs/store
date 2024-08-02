import clsx from "clsx";
import Image from "components/Image";
import { RenderDescription } from "components/listing/ListingDescription";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/Card";
import { Skeleton } from "components/ui/Skeleton";
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

  return listing ? (
    <Card
      className={clsx(
        "transition-transform duration-100 ease-in-out transform cursor-pointer",
        "flex flex-col max-w-sm rounded material-card bg-white justify-between",
        hovering ? "scale-105" : "scale-100",
      )}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={() => navigate(`/item/${listingId}`)}
    >
      <Image />
      <div className="px-3 py-4">
        <CardHeader>
          <CardTitle className="text-gray-500 text-xl mb-3">
            {listing?.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-32 overflow-hidden">
          {listing?.description && (
            <RenderDescription description={listing?.description} />
          )}
        </CardContent>
      </div>
    </Card>
  ) : (
    <div className="bg-transparent">
      <Skeleton className="h-44 w-70 bg-white" />
      <Skeleton className="h-6 w-70 mt-5 bg-white" />
      <Skeleton className="h-6 w-70 mt-5 bg-white" />
      <Skeleton className="h-5 w-70 mt-2 mb-5 bg-white" />
      <Skeleton className="h-3.5 w-70 mt-1 bg-white" />
      <Skeleton className="h-5 mt-3.5 w-20 bg-white" />
    </div>
  );
};

export default ListingGridCard;
