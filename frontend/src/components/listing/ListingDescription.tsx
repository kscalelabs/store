import { Row } from "react-bootstrap";

interface Props {
  description: string | null;
  edit: boolean;
}

const ListingDescription = (props: Props) => {
  const { description } = props;
  return <Row className="mb-3">{description && <p>{description}</p>}</Row>;
};

export default ListingDescription;
