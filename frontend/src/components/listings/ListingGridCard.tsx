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
    const firstLine = text.split("\n")[0].trim();
    return firstLine.length > 100 ? `${firstLine.slice(0, 97)}...` : firstLine;
  };

  return (
    <div className="mb-4 sm:mb-6 bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
      {listing ? (
        <>
          {listing.image_url && (
            <div className="relative pb-[100%]">
              <img
                src={listing.image_url}
                alt={listing.name}
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">
              {listing.name}
            </h3>
            {showDescription && listing.description !== null && (
              <div className="text-sm text-gray-600">
                <RenderDescription
                  description={getFirstLine(listing.description) || ""}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="animate-pulse p-4">
          <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        </div>
      )}
    </div>
  );
};

export default ListingGridCard;
