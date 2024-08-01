import { RenderDescription } from "components/listing/ListingDescription";
import { paths } from "gen/api";
import { Card, Placeholder } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

type ListingInfo =
  paths["/listings/batch"]["get"]["responses"][200]["content"]["application/json"]["listings"];

interface Props {
  listingId: string;
  listingInfo: ListingInfo | null;
}

const ListingGridCard = (props: Props) => {
  const { listingId, listingInfo } = props;
  const navigate = useNavigate();

  const part = listingInfo?.find((listing) => listing.id === listingId);

  return (
    <Card onClick={() => navigate(`/listing/${listingId}`)}>
      <Card.Body>
        <Card.Title>{part ? part.name : <Placeholder xs={6} />}</Card.Title>
        <Card.Text>
          {part?.description ? (
            <RenderDescription description={part.description} />
          ) : (
            <Placeholder xs={8} />
          )}
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default ListingGridCard;
