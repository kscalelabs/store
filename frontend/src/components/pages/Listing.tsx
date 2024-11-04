import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import ListingLoadingSkeleton from "@/components/listing/ListingLoadingSkeleton";
import ListingRenderer from "@/components/listing/ListingRenderer";
import { ListingResponse } from "@/components/listing/types";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

const Listing = () => {
  const { addErrorAlert } = useAlertQueue();
  const auth = useAuthentication();
  const { username, slug } = useParams();
  const [listing, setListing] = useState<ListingResponse | null>(null);
  const [isFetched, setIsFetched] = useState(false);

  const fetchListing = useCallback(async () => {
    if (!username || !slug) {
      addErrorAlert(new Error("Invalid URL parameters"));
      return;
    }

    try {
      // Try to fetch the listing using the username/slug endpoint
      let response = await auth.client.GET("/listings/{username}/{slug}", {
        params: {
          path: { username, slug },
        },
      });

      if (response.error) {
        addErrorAlert(response.error);
      } else if (response.data) {
        setListing(response.data);
        setIsFetched(true);
      }
    } catch (err) {
      addErrorAlert(err);
    }
  }, [username, slug, auth.client, addErrorAlert]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  // Refetch the listing when auth state changes or on initial load
  useEffect(() => {
    if (auth.isAuthenticated || !isFetched) {
      fetchListing();
    }
  }, [auth.isAuthenticated, isFetched, fetchListing]);

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex-grow">
        {isFetched && listing !== null ? (
          <ListingRenderer {...listing} />
        ) : (
          <ListingLoadingSkeleton />
        )}
      </div>
    </div>
  );
};

export default Listing;
