import { paths } from "@/gen/api";

import { RenderDescription } from "../listing/ListingDescription";

type ListingInfo =
  paths["/listings/batch"]["get"]["responses"][200]["content"]["application/json"]["listings"][0];

interface ListingGridCardProps {
  listingId: string;
  listing?: ListingInfo;
  showDescription?: boolean;
}

const ListingGridCard = ({
  listing,
  showDescription,
}: ListingGridCardProps) => {
  const getFirstLine = (text: string | null) => {
    if (!text) return null;
    const textWithoutLinks = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    const firstLine = textWithoutLinks.split("\n")[0].trim();
    return firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 h-auto flex flex-col">
      <div className="relative pb-[100%]">
        {listing?.artifacts[0].urls.large ? (
          <img
            src={listing.artifacts[0].urls.large}
            alt={listing.name}
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full bg-gray-3" />
        )}
      </div>
      <div className="p-3 flex-grow flex flex-col justify-between">
        <h3 className="text-base font-semibold mb-1 text-gray-800 line-clamp-1">
          {listing?.name || "Loading..."}
        </h3>
        {showDescription && listing?.description && (
          <div className="text-xs text-gray-600 line-clamp-2">
            <RenderDescription
              description={getFirstLine(listing.description) || ""}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingGridCard;
