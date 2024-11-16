import { FaClipboard, FaEye, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { useAlertQueue } from "@/hooks/useAlertQueue";
import ROUTES from "@/lib/types/routes";

interface Props {
  listingId: string;
  creatorId: string;
  creatorName: string | null;
  creatorUsername: string | null;
  listingSlug: string | null;
  views: number;
  createdAt: number;
}

const ListingMetadata = ({
  creatorId,
  creatorName,
  creatorUsername,
  listingSlug,
  views,
  createdAt,
}: Props) => {
  const { addAlert } = useAlertQueue();
  const navigate = useNavigate();

  const listingTag = `${creatorUsername}/${listingSlug}`;

  return (
    <>
      {/* Metadata container - all items aligned left */}
      <div className="flex flex-wrap items-center gap-4 text-sm mb-2">
        {/* Creator button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigate(ROUTES.PROFILE.buildPath({ id: creatorId }));
            }}
            className="text-blue-500 hover:bg-gray-100 rounded px-1 flex items-center gap-1"
          >
            <FaUser className="text-xs" />
            {creatorName ?? creatorUsername ?? "Creator"}
          </button>
        </div>

        {/* Listing tag */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${listingTag}`);
              addAlert("Copied to clipboard!", "success");
            }}
            className="text-blue-500 hover:bg-gray-100 rounded px-1 flex items-center gap-1"
          >
            <FaClipboard className="text-xs" />
            {listingTag}
          </button>
        </div>

        {/* Stats */}
        <span className="flex items-center gap-1">
          <FaEye /> <span className="ml-1 text-gray-7">{views} views</span>
        </span>
        <span className="text-xs">
          Posted {new Date(createdAt * 1000).toLocaleDateString()}
        </span>
      </div>
    </>
  );
};

export default ListingMetadata;
