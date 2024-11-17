import { paths } from "@/gen/api";
import { formatPrice } from "@/lib/utils/formatNumber";

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
    <div className="bg-black rounded-xl shadow-md overflow-hidden transition-transform duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 h-auto flex flex-col">
      <div className="relative pb-[100%]">
        {listing?.artifacts[0]?.artifact_type === "image" &&
        listing?.artifacts[0]?.urls.small ? (
          <div className="absolute top-0 left-0 w-full h-full p-2">
            <img
              src={listing.artifacts[0].urls.small}
              alt={listing.name}
              className="rounded-xl object-cover w-full h-full"
            />
          </div>
        ) : (
          <div className="absolute top-0 left-0 w-full h-full p-2">
            <svg
              className="w-full h-full rounded-xl text-gray-700 bg-gray-900"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-3 flex-grow flex flex-col justify-between">
        <h3 className="text-base font-semibold mb-1 text-gray-300 line-clamp-1">
          {listing?.name || "Loading..."}
        </h3>
        {showDescription && listing?.description && (
          <div className="text-xs text-white line-clamp-2">
            <RenderDescription
              description={getFirstLine(listing.description) || ""}
            />
          </div>
        )}
        {listing?.price_amount && (
          <div className="mt-2 text-sm text-gray-300">
            {formatPrice(listing.price_amount)}
            {listing.inventory_type === "finite" &&
              listing.inventory_quantity !== null && (
                <span className="ml-2 text-gray-400">
                  ({listing.inventory_quantity} available)
                </span>
              )}
            {listing.inventory_type === "preorder" && (
              <span className="ml-2 text-gray-400">(Pre-order)</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingGridCard;
