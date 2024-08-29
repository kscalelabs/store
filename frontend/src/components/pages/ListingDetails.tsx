import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { paths } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import ListingBody from "components/listing/ListingBody";
import ListingFooter from "components/listing/ListingFooter";
import ListingHeader from "components/listing/ListingHeader";
import Spinner from "components/ui/Spinner";

type ListingResponse =
  paths["/listings/{id}"]["get"]["responses"][200]["content"]["application/json"];

interface RenderListingProps {
  listing: ListingResponse;
}

const RenderListing = ({ listing }: RenderListingProps) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <ListingHeader listing={listing} />
      <div className="flex-grow">
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

  // Refetch the listing when auth state changes or on initial load
  useEffect(() => {
    if (auth.isAuthenticated || !isFetched) {
      fetchListing();
    }
  }, [auth.isAuthenticated, isFetched, fetchListing]);

  return isFetched && listing ? (
    <RenderListing listing={listing} />
  ) : (
    <div className="flex justify-center items-center pt-8">
      <Spinner />
    </div>
  );
};

export default ListingDetails;
