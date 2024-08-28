import { paths } from "gen/api";

import ListingArtifacts from "components/listing/ListingArtifacts";
import ListingChildren from "components/listing/ListingChildren";
import ListingDescription from "components/listing/ListingDescription";
import ListingOnshape from "components/listing/onshape/ListingOnshape";

import ListingUrdf from "./ListingUrdf";

type ListingResponse =
  paths["/listings/{id}"]["get"]["responses"][200]["content"]["application/json"];

interface ListingBodyProps {
  listing: ListingResponse;
}

const ListingBody = (props: ListingBodyProps) => {
  const { listing } = props;
  return (
    <div className="px-4">
      <ListingDescription
        listingId={listing.id}
        description={listing.description}
        edit={listing.can_edit}
      />
      <ListingChildren child_ids={listing.child_ids} edit={listing.can_edit} />
      <ListingOnshape
        listingId={listing.id}
        onshapeUrl={listing.onshape_url}
        edit={listing.can_edit}
      />
      <ListingUrdf listingId={listing.id} edit={listing.can_edit} />
      <ListingArtifacts listingId={listing.id} edit={listing.can_edit} />
    </div>
  );
};

export default ListingBody;
