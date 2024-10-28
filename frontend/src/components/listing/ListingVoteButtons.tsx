import { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { humanReadableError, useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

interface ListingVoteButtonsProps {
  listingId: string;
  initialScore: number;
  initialUserVote: boolean | null;
  small?: boolean;
}

const ListingVoteButtons = ({
  listingId,
  initialScore,
  initialUserVote,
  small = false,
}: ListingVoteButtonsProps) => {
  const auth = useAuthentication();
  const navigate = useNavigate();
  const { addErrorAlert } = useAlertQueue();
  const [isVoting, setIsVoting] = useState(false);
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<boolean | null>(initialUserVote);

  useEffect(() => {
    setUserVote(initialUserVote);
  }, [initialUserVote]);

  const handleVote = async (upvote: boolean, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!auth.isAuthenticated) {
      navigate("/login");
      return;
    }

    if (isVoting) return;

    setIsVoting(true);
    const previousVote = userVote;
    const previousScore = score;

    // Optimistically update UI
    if (userVote === upvote) {
      setScore(score + (upvote ? -1 : 1));
      setUserVote(null);
    } else {
      setScore(
        score + (upvote ? 1 : -1) + (userVote === null ? 0 : upvote ? 1 : -1),
      );
      setUserVote(upvote);
    }

    try {
      if (previousVote === upvote) {
        // Remove vote
        await auth.client.DELETE(`/listings/{id}/vote`, {
          params: { path: { id: listingId } },
        });
      } else {
        // Add or change vote
        const { error } = await auth.client.POST(`/listings/{id}/vote`, {
          params: {
            path: { id: listingId },
            query: { upvote },
          },
        });
        if (error) throw error;
      }
    } catch (error) {
      // Revert changes if API call fails
      setScore(previousScore);
      setUserVote(previousVote);
      addErrorAlert(humanReadableError(error));
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div
      className={`flex flex-col items-center rounded-full p-1 ${"bg-gray-3"}`}
    >
      <button
        onClick={(e) => handleVote(true, e)}
        className={`${small ? "text-xl" : "text-2xl"} ${
          userVote === true ? "text-green-500" : "text-gray-11"
        } hover:text-green-600 transition-colors duration-200 mb-2`}
        disabled={isVoting}
      >
        <FaChevronUp />
      </button>
      <button
        onClick={(e) => handleVote(false, e)}
        className={`${small ? "text-xl" : "text-2xl"} ${
          userVote === false ? "text-red-500" : "text-gray-11"
        } hover:text-red-600 transition-colors duration-200`}
        disabled={isVoting}
      >
        <FaChevronDown />
      </button>
    </div>
  );
};

export default ListingVoteButtons;
