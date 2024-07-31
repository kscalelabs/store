import { paths } from "gen/api";
import { Card, Placeholder } from "react-bootstrap";
import Markdown from "react-markdown";
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
          <Markdown
            components={{
              p: ({ ...props }) => <p {...props} />,
              li: ({ ...props }) => <li {...props} />,
              h1: ({ ...props }) => <h3 {...props} className="h6" />,
              h2: ({ ...props }) => <h4 {...props} className="h6" />,
              h3: ({ ...props }) => <h5 {...props} className="h6" />,
              h4: ({ ...props }) => <h6 {...props} className="h6" />,
              h5: ({ ...props }) => <h6 {...props} className="h6" />,
              h6: ({ ...props }) => <h6 {...props} className="h6" />,
            }}
          >
            {part?.description}
          </Markdown>
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default ListingGridCard;
