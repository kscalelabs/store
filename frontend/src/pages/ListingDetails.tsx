import ListingArtifacts from "components/listing/ListingArtifacts";
import ListingChildren from "components/listing/ListingChildren";
import ListingDeleteButton from "components/listing/ListingDeleteButton";
import ListingDescription from "components/listing/ListingDescription";
import ListingTitle from "components/listing/ListingTitle";
import { Button } from "components/ui/Button/Button";
import Spinner from "components/ui/Spinner";
import { paths } from "gen/api";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";

type ListingResponse =
  paths["/listings/{id}"]["get"]["responses"][200]["content"]["application/json"];

interface RenderListingProps {
  listing: ListingResponse;
}

const RenderListing = (props: RenderListingProps) => {
  const { listing } = props;

  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4 max-w-4xl shadow-md px-4 rounded-lg bg-white dark:bg-gray-800 dark:text-white border bg-card text-card-foreground relative">
      <span className="absolute top-4 right-4 flex space-x-2">
        {listing.owner_is_user && (
          <ListingDeleteButton listing_id={listing.id} />
        )}
        <Button
          onClick={() => navigate(-1)}
          variant={"outline"}
          className="hover:bg-gray-200 dark:hover:bg-gray-700 bg-opacity-50"
        >
          <span className="mr-2">Close</span>
          <FaTimes />
        </Button>
      </span>
      <ListingTitle title={listing.name} edit={listing.owner_is_user} />
      <ListingDescription
        description={listing.description}
        edit={listing.owner_is_user}
      />
      <ListingChildren
        child_ids={listing.child_ids}
        edit={listing.owner_is_user}
      />
      <ListingArtifacts listing_id={listing.id} edit={listing.owner_is_user} />
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
