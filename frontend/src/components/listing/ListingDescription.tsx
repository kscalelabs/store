import { Row } from "react-bootstrap";

interface Props {
  description: string | null;
  // TODO: If can edit, allow the user to update the description.
  edit: boolean;
}

const ListingDescription = (props: Props) => {
  const { description } = props;
  return <Row className="mb-3">{description && <p>{description}</p>}</Row>;
};

export default ListingDescription;
