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
      const response = await auth.client.GET("/listings/{username}/{slug}", {
        params: {
          path: { username, slug },
        },
      });

      if (response.error) {
        addErrorAlert(response.error);
      } else if (response.data !== null) {
        setListing(response.data);
        setIsFetched(true);
      }
    } catch (err) {
      addErrorAlert(err);
    }
  }, [username, slug, auth.client, addErrorAlert]);

  useEffect(() => {
    const shouldFetch =
      (listing === null && username && slug) ||
      (auth.isAuthenticated && !isFetched);

    if (shouldFetch) {
      fetchListing();
    }
  }, [username, slug, auth.isAuthenticated, isFetched, listing, fetchListing]);

  useEffect(() => {
    setListing(null);
    setIsFetched(false);
  }, [username, slug]);

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex-grow">
        {isFetched && listing !== null ? (
          <ListingRenderer listing={listing} />
        ) : (
          <ListingLoadingSkeleton />
        )}
      </div>
    </div>
  );
};

export default Listing;
