import { paths } from "gen/api";

import ListingArtifacts from "./ListingArtifacts";
import ListingChildren from "./ListingChildren";
import ListingDescription from "./ListingDescription";

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
        edit={listing.owner_is_user}
      />
      <ListingChildren
        child_ids={listing.child_ids}
        edit={listing.owner_is_user}
      />
      <ListingArtifacts listingId={listing.id} edit={listing.owner_is_user} />
    </div>
  );
};

export default ListingBody;
