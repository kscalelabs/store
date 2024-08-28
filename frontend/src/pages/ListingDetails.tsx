import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { paths } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import ListingBody from "components/listing/ListingBody";
import ListingFooter from "components/listing/ListingFooter";
import ListingHeader from "components/listing/ListingHeader";
import VoteButtons from "components/listing/VoteButtons";
import Spinner from "components/ui/Spinner";

type ListingResponse =
  paths["/listings/{id}"]["get"]["responses"][200]["content"]["application/json"];

interface RenderListingProps {
  listing: ListingResponse;
  onVoteChange: (newScore: number, newUserVote: boolean | null) => void;
}

const RenderListing = ({ listing, onVoteChange }: RenderListingProps) => {
  return (
    <div className="container mx-auto max-w-6xl">
      <ListingHeader
        listingId={listing.id}
        title={listing.name}
        edit={listing.can_edit}
      />
      <div className="flex items-start">
        <VoteButtons
          listingId={listing.id}
          initialScore={listing.score}
          initialUserVote={listing.user_vote}
          onVoteChange={onVoteChange}
        />
        <ListingBody listing={listing} />
      </div>
      <div className="mt-4 text-sm text-gray-500">Views: {listing.views}</div>
      <ListingFooter listingId={listing.id} edit={listing.can_edit} />
    </div>
  );
};

const ListingDetails = () => {
  const { addErrorAlert } = useAlertQueue();
  const auth = useAuthentication();
  const { id } = useParams();
  const [listing, setListing] = useState<ListingResponse | null>(null);
  const [isFetched, setIsFetched] = useState(false);

  const handleVoteChange = useCallback(
    (newScore: number, newUserVote: boolean | null) => {
      if (listing) {
        setListing({
          ...listing,
          score: newScore,
          user_vote: newUserVote,
        });
      }
    },
    [listing],
  );

  const fetchListing = useCallback(async () => {
    if (id === undefined) {
      return;
    }

    try {
      const { data, error } = await auth.client.GET("/listings/{id}", {
        params: {
          path: { id },
        },
      });
      if (error) {
        addErrorAlert(error);
      } else {
        setListing(data);
        setIsFetched(true);
      }
    } catch (err) {
      addErrorAlert(err);
    }
  }, [id, auth.client, addErrorAlert]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  useEffect(() => {
    const incrementViewCount = async () => {
      if (id) {
        try {
          await auth.client.POST(`/listings/{id}/view`, {
            params: {
              path: { id },
            },
          });
        } catch (err) {
          console.error("Failed to increment view count", err);
        }
      }
    };
    incrementViewCount();
  }, [id, auth.client]);

  // Modify this effect to refetch the listing when auth state changes or on initial load
  useEffect(() => {
    if (auth.isAuthenticated || !isFetched) {
      fetchListing();
    }
  }, [auth.isAuthenticated, isFetched, fetchListing]);

  return isFetched && listing && id ? (
    <RenderListing listing={listing} onVoteChange={handleVoteChange} />
  ) : (
    <div className="flex justify-center items-center pt-8">
      <Spinner />
    </div>
  );
};

export default ListingDetails;
