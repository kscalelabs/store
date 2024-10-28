import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import ListingBody from "@/components/listing/ListingBody";
import Spinner from "@/components/ui/Spinner";
import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

type ListingResponse =
  paths["/listings/{id}"]["get"]["responses"][200]["content"]["application/json"];

interface RenderListingProps {
  listing: ListingResponse;
}

const RenderListing = ({ listing }: RenderListingProps) => {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex-grow">
        <ListingBody listing={listing} />
      </div>
    </div>
  );
};

const ListingDetails = () => {
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
        // If not found, try fetching by ID using the slug
        response = await auth.client.GET("/listings/{id}", {
          params: {
            path: { id: slug },
          },
        });
      }

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

  useEffect(() => {
    const incrementViewCount = async () => {
      if (listing?.id) {
        try {
          await auth.client.POST(`/listings/{id}/view`, {
            params: {
              path: { id: listing.id },
            },
          });
        } catch (err) {
          console.error("Failed to increment view count", err);
        }
      }
    };
    incrementViewCount();
  }, [listing?.id, auth.client]);

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
