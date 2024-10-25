import { useEffect, useState } from "react";
import { FaCheck, FaEye, FaHome, FaList, FaPen } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import ListingVoteButtons from "@/components/listing/ListingVoteButtons";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input/Input";
import Spinner from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { formatNumber } from "@/lib/utils/formatNumber";
import { formatTimeSince } from "@/lib/utils/formatTimeSince";

import ListingDeleteButton from "./ListingDeleteButton";

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
              className="border-b border-gray-5"
              autoFocus
            />
          ) : (
            <h1 className="text-2xl font-semibold pr-2">{newTitle}</h1>
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

const NavigationButtons = ({ listing }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="flex space-x-2">
      <Button
        onClick={() => navigate("/")}
        variant="outline"
        className="hover:bg-gray-6 bg-opacity-50"
      >
        <FaHome className="mr-2" />
        <span className="hidden md:inline">Home</span>
      </Button>
      <Button
        onClick={() => navigate("/browse")}
        variant="outline"
        className="hover:bg-gray-6 bg-opacity-50"
      >
        <FaList className="mr-2" />
        <span className="hidden md:inline">Browse</span>
      </Button>
      {listing.can_edit && <ListingDeleteButton listingId={listing.id} />}
    </div>
  );
};

const ListingHeader = (props: Props) => {
  const { listing } = props;
  const navigate = useNavigate();
  const auth = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();

  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [newSlug, setNewSlug] = useState(listing.slug || "");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (auth.currentUser && newSlug) {
      setPreviewUrl(`/item/${auth.currentUser.username}/${newSlug}`);
    }
  }, [auth.currentUser, newSlug]);

  const handleSaveSlug = async () => {
    if (newSlug === listing.slug) {
      setIsEditingSlug(false);
      return;
    }

    const { error } = await auth.client.PUT(`/listings/edit/{id}/slug`, {
      params: { path: { id: listing.id }, query: { new_slug: newSlug } },
    });

    if (error) {
      addErrorAlert(error);
    } else {
      addAlert("Listing URL updated successfully", "success");
      setIsEditingSlug(false);
      // Redirect to the new URL
      if (newSlug !== "") {
        navigate(`/item/${auth.currentUser?.username}/${newSlug}`);
      }
    }
  };

  const sanitizeSlug = (input: string) => {
    // Allow alphanumeric characters and dashes, replace spaces with dashes
    return input
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-") // Replace multiple consecutive dashes with a single dash
      .replace(/^-|-$/g, ""); // Remove leading and trailing dashes
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 items-center">
            <ListingVoteButtons
              listingId={listing.id}
              initialScore={listing.score}
              initialUserVote={listing.user_vote}
            />
            <div>
              <ListingTitle {...props} />
              <div className="mt-2 text-sm text-muted-foreground flex items-center gap-4 flex-wrap">
                <div className="flex items-center">
                  <FaEye className="mr-1" />
                  <span>{formatNumber(listing.views)} views</span>
                </div>
                <div>
                  Posted {formatTimeSince(new Date(listing.created_at * 1000))}
                </div>
              </div>
              {listing.creator_name && (
                <div className="text-sm mt-1 flex items-center text-primary hover:underline hover:text-primary/80 cursor-pointer">
                  <p onClick={() => navigate(`/profile/${listing.creator_id}`)}>
                    By {listing.creator_name}
                  </p>{" "}
                </div>
              )}
              {/* URL editing section */}
              {listing.can_edit && (
                <div className="mt-2">
                  {isEditingSlug ? (
                    <div className="flex flex-col space-y-2">
                      <Input
                        type="text"
                        value={newSlug}
                        onChange={(e) =>
                          setNewSlug(sanitizeSlug(e.target.value))
                        }
                        className="border-b border-gray-5"
                        placeholder="Enter new URL slug"
                      />
                      {previewUrl && (
                        <div className="text-sm text-gray-11 font-medium">
                          Preview: {previewUrl}
                        </div>
                      )}
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleSaveSlug}
                          variant="primary"
                          size="sm"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => setIsEditingSlug(false)}
                          variant="ghost"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setIsEditingSlug(true)}
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80"
                    >
                      <FaPen className="mr-2" /> Edit URL
                    </Button>
                  )}
                </div>
              )}
            </div>
            <NavigationButtons {...props} />
          </div>
        </CardTitle>
      </CardHeader>
    </Card>
  );
};

export default ListingHeader;
