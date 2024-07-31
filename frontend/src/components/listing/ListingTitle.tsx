import { Row } from "react-bootstrap";

interface Props {
  title: string;
}

const ListingTitle = (props: Props) => {
  const { title } = props;
  return (
    <Row className="mb-3">
      <h1 className="display-4">{title}</h1>
    </Row>
  );
};

export default ListingTitle;
