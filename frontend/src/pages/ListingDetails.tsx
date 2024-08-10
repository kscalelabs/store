import { useEffect, useState } from "react";
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

const RenderListing = (props: RenderListingProps) => {
  const { listing } = props;

  return (
    <div className="container mx-auto max-w-4xl shadow-md rounded-lg bg-white dark:bg-gray-800 dark:text-white border bg-card text-card-foreground relative">
      <ListingHeader
        listingId={listing.id}
        title={listing.name}
        edit={listing.owner_is_user}
      />
      <ListingBody listing={listing} />
      <ListingFooter listingId={listing.id} edit={listing.owner_is_user} />
    </div>
  );
};

const ListingDetails = () => {
  const { addErrorAlert } = useAlertQueue();
  const auth = useAuthentication();
  const { id } = useParams();
  const [listing, setListing] = useState<ListingResponse | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
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
        }
      } catch (err) {
        addErrorAlert(err);
      }
    };
    fetchListing();
  }, [id]);

  return listing && id ? (
    <RenderListing listing={listing} />
  ) : (
    <div className="flex justify-center items-center pt-8">
      <Spinner />
    </div>
  );
};

export default ListingDetails;
