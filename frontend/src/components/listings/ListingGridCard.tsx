import clsx from "clsx";
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

  const part = listingInfo?.find((listing) => listing.id === listingId);

  return (
    <div
      className="flex flex-col items-center justify-center p-4 m-4 rounded-lg cursor-pointer"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {part ? (
        <div
          className={clsx(
            "transition-transform duration-100 ease-in-out transform",
            hovering ? "scale-105" : "scale-100",
            "w-64 h-64 object-cover rounded-lg",
          )}
          onClick={() => navigate(`/listing/${listingId}`)}
        >
          <img
            className="w-full h-full object-cover rounded-lg"
            // Use a placeholder image if the part has no image
            src="https://placehold.co/256/DDDDDD/555"
          />
          <div className="w-full absolute bottom-0 left-0 text-center p-2">
            <div className="p-5 bg-gray-100 bg-opacity-75 dark:bg-gray-800 rounded-lg">
              <h1 className="text-md truncate max-w-full">{part.name}</h1>
            </div>
          </div>
        </div>
      ) : (
        // Use a slowly moving placeholder image if the part is loading
        <div className="w-64 h-64 animate-pulse">
          <div className="w-full h-full bg-gray-300 dark:bg-gray-700 rounded-lg" />
        </div>
      )}
    </div>
  );
};

export default ListingGridCard;
