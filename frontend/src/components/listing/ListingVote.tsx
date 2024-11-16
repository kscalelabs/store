import { useState } from "react";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";

import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

interface Props {
  listingId: string;
  userVote: boolean | null;
}

const ListingVote = ({ listingId, userVote: initialUserVote }: Props) => {
  const auth = useAuthentication();
  const [voting, setVoting] = useState(false);
  const [userVote, setUserVote] = useState(initialUserVote);
  const { addErrorAlert, addAlert } = useAlertQueue();

  const handleVote = async (vote: boolean) => {
    if (!auth.isAuthenticated) {
      addErrorAlert("You must be logged in to vote");
      return;
    }

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

  return (
    <div className="flex items-center gap-2 text-gray-3">
      <button
        className={`p-1 hover:bg-gray-1 hover:text-gray-12 rounded ${
          userVote === false && !voting ? "text-red-500" : ""
        }`}
        onClick={() => handleVote(false)}
        disabled={voting || !auth.isAuthenticated}
      >
        <FaArrowDown />
      </button>
      <button
        className={`p-1 hover:bg-gray-1 hover:text-gray-12 rounded ${
          userVote === true && !voting ? "text-green-500" : ""
        }`}
        onClick={() => handleVote(true)}
        disabled={voting || !auth.isAuthenticated}
      >
        <FaArrowUp />
      </button>
    </div>
  );
};

export default ListingVote;
