import { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { humanReadableError, useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

interface ListingVoteButtonsProps {
  listingId: string;
  initialScore: number;
  initialUserVote: boolean | null;
}

const ListingVoteButtons = ({
  listingId,
  initialScore,
  initialUserVote,
}: ListingVoteButtonsProps) => {
  const auth = useAuthentication();
  const navigate = useNavigate();
  const { addErrorAlert } = useAlertQueue();
  const [isVoting, setIsVoting] = useState(false);
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);

  const handleVote = async (upvote: boolean, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!auth.isAuthenticated) {
      navigate("/login");
      return;
    }

    if (isVoting) {
      return; // Prevent double-clicking
    }

    setIsVoting(true);

    if (isVoting) {
      return; // Prevent double-clicking
    }

    setIsVoting(true);

    try {
      if (userVote === upvote) {
        // Remove vote
        await auth.client.DELETE(`/listings/{id}/vote`, {
          params: { path: { id: listingId } },
        });
        setScore(score + (upvote ? -1 : 1));
        setUserVote(null);
      } else {
        // Add or change vote
        await auth.client.POST(`/listings/{id}/vote`, {
          params: {
            path: { id: listingId },
            query: { upvote },
          },
        });
        setScore(
          score + (upvote ? 1 : -1) + (userVote === null ? 0 : upvote ? 1 : -1),
        );
        setUserVote(upvote);
      }
    } catch (error) {
      addErrorAlert(humanReadableError(error));
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex flex-col items-center mr-4">
      <button
        onClick={(e) => handleVote(true, e)}
        className={`text-2xl ${
          userVote === true ? "text-green-500" : "text-gray-400"
        } hover:text-green-600 transition-colors duration-200`}
        disabled={isVoting}
      >
        <FaChevronUp />
      </button>
      <span className="text-lg text-gray-800 font-bold my-1">{score}</span>
      <button
        onClick={(e) => handleVote(false, e)}
        className={`text-2xl ${
          userVote === false ? "text-red-500" : "text-gray-400"
        } hover:text-red-600 transition-colors duration-200`}
        disabled={isVoting}
      >
        <FaChevronDown />
      </button>
    </div>
  );
};

export default ListingVoteButtons;
