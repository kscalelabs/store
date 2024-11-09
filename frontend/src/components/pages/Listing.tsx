import { useCallback, useEffect, useState } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import ListingLoadingSkeleton from "@/components/listing/ListingLoadingSkeleton";
import ListingRenderer from "@/components/listing/ListingRenderer";
import { ListingResponse } from "@/components/listing/types";
import Container from "@/components/ui/container";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";

const Listing = () => {
  const { addErrorAlert } = useAlertQueue();
  const auth = useAuthentication();
  const { username, slug } = useTypedParams(ROUTES.BOT);
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
    <Container>
      <div className="flex-grow">
        {isFetched && listing !== null ? (
          <ListingRenderer listing={listing} />
        ) : (
          <ListingLoadingSkeleton />
        )}
      </div>
    </Container>
  );
};

export default Listing;
