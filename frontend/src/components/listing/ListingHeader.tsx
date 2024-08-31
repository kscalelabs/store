import { useState } from "react";
import { FaCheck, FaEye, FaHome, FaList, FaPen, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { paths } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";
import { formatNumber } from "utils/formatNumber";
import { formatTimeSince } from "utils/formatTimeSince";

import ListingVoteButtons from "components/listing/ListingVoteButtons";
import { Button } from "components/ui/Button/Button";
import { Input } from "components/ui/Input/Input";
import Spinner from "components/ui/Spinner";

type ListingResponse =
  paths["/listings/{id}"]["get"]["responses"][200]["content"]["application/json"];

interface Props {
  listing: ListingResponse;
}

const ListingTitle = (props: Props) => {
  const { listing } = props;

  const auth = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();

  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(listing.name);
  const [hasChanged, setHasChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!hasChanged) {
      setIsEditing(false);
      return;
    }
    if (newTitle.length < 4) {
      addErrorAlert("Title must be at least 4 characters long.");
      return;
    }
    setSubmitting(true);
    const { error } = await auth.client.PUT("/listings/edit/{id}", {
      params: {
        path: { id: listing.id },
      },
      body: {
        name: newTitle,
      },
    });
    if (error) {
      addErrorAlert(error);
    } else {
      addAlert("Listing updated successfully", "success");
      setIsEditing(false);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex items-center">
      {submitting ? (
        <Spinner />
      ) : (
        <>
          {isEditing ? (
            <Input
              type="text"
              value={newTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave();
                }
              }}
              onChange={(e) => {
                setNewTitle(e.target.value);
                setHasChanged(true);
              }}
              className="border-b border-gray-300 dark:border-gray-700"
              autoFocus
            />
          ) : (
            <h1 className="text-2xl font-semibold">{newTitle}</h1>
          )}
          {listing.can_edit && (
            <Button
              onClick={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                }
              }}
              variant="ghost"
            >
              {isEditing ? <FaCheck /> : <FaPen />}
            </Button>
          )}
        </>
      )}
    </div>
  );
};

const NavigationButtons = () => {
  const navigate = useNavigate();

  return (
    <div className="flex space-x-2">
      <Button
        onClick={() => navigate("/")}
        variant="outline"
        className="hover:bg-gray-200 dark:hover:bg-gray-700 bg-opacity-50"
      >
        <FaHome className="mr-2" />
        <span className="hidden md:inline">Home</span>
      </Button>
      <Button
        onClick={() => navigate("/browse")}
        variant="outline"
        className="hover:bg-gray-200 dark:hover:bg-gray-700 bg-opacity-50"
      >
        <FaList className="mr-2" />
        <span className="hidden md:inline">Browse</span>
      </Button>
    </div>
  );
};

const ListingHeader = (props: Props) => {
  const { listing } = props;
  const navigate = useNavigate();

  return (
    <div className="relative p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 items-center">
        <ListingVoteButtons
          listingId={listing.id}
          initialScore={listing.score}
          initialUserVote={listing.user_vote}
        />
        <div>
          <ListingTitle {...props} />
          <div className="mt-2 text-sm text-gray-500 flex items-center gap-4 flex-wrap">
            <div className="flex items-center">
              <FaEye className="mr-1" />
              <span>{formatNumber(listing.views)} views</span>
            </div>
            <div>
              Posted {formatTimeSince(new Date(listing.created_at * 1000))}
            </div>
          </div>
        </div>
        <NavigationButtons />
      </div>
    </div>
  );
};

export default ListingHeader;
