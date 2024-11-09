import { useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaClipboard,
  FaEye,
  FaUser,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";

interface Props {
  listingId: string;
  creatorId: string;
  creatorName: string | null;
  creatorUsername: string | null;
  listingSlug: string | null;
  views: number;
  createdAt: number;
  userVote: boolean | null;
}

const ListingMetadata = ({
  listingId,
  creatorId,
  creatorName,
  creatorUsername,
  listingSlug,
  views,
  createdAt,
  userVote: initialUserVote,
}: Props) => {
  const auth = useAuthentication();
  const [voting, setVoting] = useState(false);
  const [userVote, setUserVote] = useState(initialUserVote);
  const { addErrorAlert, addAlert } = useAlertQueue();
  const navigate = useNavigate();

  const handleVote = async (vote: boolean) => {
    setVoting(true);
    try {
      if (userVote === vote) {
        const response = await auth.client.DELETE("/listings/{id}/vote", {
          params: {
            path: {
              id: listingId,
            },
          },
        });
        if (response.error) {
          addErrorAlert(response.error);
        } else {
          addAlert("Vote removed", "success");
          setUserVote(null);
        }
      } else {
        const response = await auth.client.POST("/listings/{id}/vote", {
          params: {
            path: {
              id: listingId,
            },
            query: {
              upvote: vote,
            },
          },
        });
        if (response.error) {
          addErrorAlert(response.error);
        } else {
          addAlert("Vote added", "success");
          setUserVote(vote);
        }
      }
    } catch (error) {
      addErrorAlert(error);
    } finally {
      setVoting(false);
    }
  };

  const listingTag = `${creatorUsername}/${listingSlug}`;

  return (
    <>
      {/* Metadata container - all items aligned left */}
      <div className="flex flex-wrap items-center gap-4 text-sm mb-2">
        {/* Voting buttons */}
        <div className="flex items-center gap-2 text-gray-600">
          <button
            className={`p-1 hover:bg-gray-100 rounded ${userVote === true && !voting ? "text-green-500" : ""}`}
            onClick={() => handleVote(true)}
            disabled={voting}
          >
            <FaArrowUp />
          </button>
          <button
            className={`p-1 hover:bg-gray-100 rounded ${
              userVote === false && !voting ? "text-red-500" : ""
            }`}
            onClick={() => handleVote(false)}
            disabled={voting}
          >
            <FaArrowDown />
          </button>
        </div>

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
        <span className="flex items-center gap-1 text-gray-600">
          <FaEye /> {views} views
        </span>
        <span className="text-gray-600">
          Posted {new Date(createdAt * 1000).toLocaleDateString()}
        </span>
      </div>
    </>
  );
};

export default ListingMetadata;
