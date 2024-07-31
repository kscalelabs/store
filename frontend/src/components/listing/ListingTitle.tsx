import { Row } from "react-bootstrap";

interface Props {
  title: string;
  // TODO: If can edit, allow the user to update the title.
  edit: boolean;
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
