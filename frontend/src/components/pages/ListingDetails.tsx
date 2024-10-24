import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import ListingBody from "@/components/listing/ListingBody";
import ListingHeader from "@/components/listing/ListingHeader";
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <ListingHeader listing={listing} />
      <div className="flex-grow">
        <ListingBody listing={listing} />
      </div>
    </div>
  );
};

const ListingDetails = () => {
  const { addErrorAlert } = useAlertQueue();
  const auth = useAuthentication();
  const { username, slug, id } = useParams();
  const [listing, setListing] = useState<ListingResponse | null>(null);
  const [isFetched, setIsFetched] = useState(false);

  const fetchListing = useCallback(async () => {
    try {
      let data, error;

      if (username && slug) {
        // Try to fetch the listing using the username/slug endpoint
        ({ data, error } = await auth.client.GET(
          "/listings/{username}/{slug}",
          {
            params: {
              path: { username, slug },
            },
          },
        ));
      } else if (id) {
        // Fetch the listing using the ID-based endpoint
        ({ data, error } = await auth.client.GET("/listings/{id}", {
          params: {
            path: { id },
          },
        }));
      } else {
        throw new Error("Invalid URL parameters");
      }

      if (error) {
        addErrorAlert(error);
      } else if (data) {
        setListing(data);
        setIsFetched(true);
      }
    } catch (err) {
      addErrorAlert(err);
    }
  }, [username, slug, id, auth.client, addErrorAlert]);

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
