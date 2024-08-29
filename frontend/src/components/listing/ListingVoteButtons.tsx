import { FaChevronDown, FaChevronUp } from "react-icons/fa";

import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

interface ListingVoteButtonsProps {
  listingId: string;
  initialScore: number;
  initialUserVote: boolean | null;
  onVoteChange: (newScore: number, newUserVote: boolean | null) => void;
}

const ListingVoteButtons = ({
  listingId,
  initialScore,
  initialUserVote,
  onVoteChange,
}: ListingVoteButtonsProps) => {
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const handleVote = async (upvote: boolean, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!auth.isAuthenticated) {
      addErrorAlert("You must be logged in to vote");
      return;
    }

    const newVote = initialUserVote === upvote ? null : upvote;
    let scoreDelta;

    if (newVote === null) {
      scoreDelta = initialUserVote ? -1 : 1;
    } else if (initialUserVote === null) {
      scoreDelta = upvote ? 1 : -1;
    } else {
      scoreDelta = upvote ? 2 : -2;
    }

    const newScore = initialScore + scoreDelta;

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
      onVoteChange(initialScore, initialUserVote);
    }
  };

  return (
    <div className="flex flex-col items-center mr-4">
      <button
        onClick={(e) => handleVote(true, e)}
        className={`text-2xl ${
          initialUserVote === true ? "text-green-500" : "text-gray-400"
        } hover:text-green-600 transition-colors duration-200`}
      >
        <FaChevronUp />
      </button>
      <span className="text-lg font-bold my-1">{initialScore}</span>
      <button
        onClick={(e) => handleVote(false, e)}
        className={`text-2xl ${
          initialUserVote === false ? "text-red-500" : "text-gray-400"
        } hover:text-red-600 transition-colors duration-200`}
      >
        <FaChevronDown />
      </button>
    </div>
  );
};

export default ListingVoteButtons;
