import ListingArtifacts from "components/listing/ListingArtifacts";
import ListingChildren from "components/listing/ListingChildren";
import ListingDeleteButton from "components/listing/ListingDeleteButton";
import ListingDescription from "components/listing/ListingDescription";
import ListingTitle from "components/listing/ListingTitle";
import Breadcrumbs from "components/ui/Breadcrumb/Breadcrumbs";
import Spinner from "components/ui/Spinner";
import { paths } from "gen/api";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type ListingResponse =
  paths["/listings/{id}"]["get"]["responses"][200]["content"]["application/json"];

interface RenderListingProps {
  listing: ListingResponse;
}

const RenderListing = (props: RenderListingProps) => {
  const { listing } = props;
  return (
    <div className="pt-4">
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
      {listing.owner_is_user && <ListingDeleteButton listing_id={listing.id} />}
    </div>
  );
};

const ListingDetails = () => {
  const { addErrorAlert } = useAlertQueue();
  const auth = useAuthentication();
  const { id } = useParams();
  const [listing, setListing] = useState<ListingResponse | null>(null);

  const navigate = useNavigate();

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

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", onClick: () => navigate("/") },
          { label: "Listings", onClick: () => navigate("/listings") },
          { label: "Listing" },
        ]}
      />

      {listing && id ? (
        <RenderListing listing={listing} />
      ) : (
        <div className="flex justify-center items-center h-screen">
          <Spinner />
        </div>
      )}
    </>
  );
};

export default ListingDetails;
