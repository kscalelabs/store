import { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

interface VoteButtonsProps {
  listingId: string;
  initialScore: number;
  initialUserVote: boolean | null;
  onVoteChange: (newScore: number, newUserVote: boolean | null) => void;
}

const VoteButtons = ({
  listingId,
  initialScore,
  initialUserVote,
  onVoteChange,
}: VoteButtonsProps) => {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const handleVote = async (upvote: boolean) => {
    if (!auth.isAuthenticated) {
      addErrorAlert("You must be logged in to vote");
      return;
    }

    const newVote = userVote === upvote ? null : upvote;
    const scoreDelta =
      newVote === null ? (userVote ? -1 : 1) : newVote ? 1 : -1;
    const newScore = score + scoreDelta;

    setUserVote(newVote);
    setScore(newScore);
    onVoteChange(newScore, newVote);

    try {
      await auth.client.POST(`/listings/{id}/vote`, {
        params: {
          path: { id: listingId },
          query: { upvote },
        },
      });
    } catch {
      addErrorAlert("Failed to submit vote");
      // Revert the optimistic update
      setUserVote(userVote);
      setScore(score);
      onVoteChange(score, userVote);
    }
  };

  return (
    <div className="flex flex-col items-center mr-4">
      <button
        onClick={() => handleVote(true)}
        className={`text-2xl ${
          userVote === true ? "text-green-500" : "text-gray-400"
        } hover:text-green-600 transition-colors duration-200`}
      >
        <FaChevronUp />
      </button>
      <span className="text-lg font-bold my-1">{score}</span>
      <button
        onClick={() => handleVote(false)}
        className={`text-2xl ${
          userVote === false ? "text-red-500" : "text-gray-400"
        } hover:text-red-600 transition-colors duration-200`}
      >
        <FaChevronDown />
      </button>
    </div>
  );
};

export default VoteButtons;
