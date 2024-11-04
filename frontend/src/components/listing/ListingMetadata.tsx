import { useState } from "react";
import { FaArrowDown, FaArrowUp, FaEye } from "react-icons/fa";

import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

import ListingRegisterRobot from "./ListingRegisterRobot";

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

  const handleVote = async (vote: boolean) => {
    setVoting(true);
    try {
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
        addAlert("Vote cast successfully", "success");
        setUserVote(vote);
      }
    } catch (error) {
      addErrorAlert(error);
    } finally {
      setVoting(false);
    }
  };

  return (
    <>
      {/* Listed by */}
      <div className="flex items-center gap-2 text-sm mb-2">
        <span>Created by</span>
        <a
          href={`/profile/${creatorId}`}
          className="text-blue-500 hover:underline"
        >
          {creatorName ?? creatorUsername ?? "Creator"}
        </a>
      </div>

      {/* Listing slug */}
      <div className="flex items-center gap-2 text-sm mb-2">
        <span>Listing</span>
        <span className="text-gray-12">
          {creatorUsername}/{listingSlug}
        </span>
      </div>

      {/* Voting and other metadata */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
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
        <span className="flex items-center gap-1">
          <FaEye /> {views} views
        </span>
        <span>Posted {new Date(createdAt * 1000).toLocaleDateString()}</span>
      </div>

      {/* Build this robot */}
      <ListingRegisterRobot listingId={listingId} />
    </>
  );
};

export default ListingMetadata;
