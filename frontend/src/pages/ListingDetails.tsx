import { humanReadableError } from "constants/backend";
import { paths } from "gen/api";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import { Breadcrumb, Col, Container, Row, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";

type ListingResponse =
  paths["/listings/{id}"]["get"]["responses"][200]["content"]["application/json"];

interface RenderListingProps {
  listing: ListingResponse;
}

const RenderListing = (props: RenderListingProps) => {
  return <div>Placeholder for {props.listing.id}</div>;
};

const ListingDetails = () => {
  const { addAlert } = useAlertQueue();
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
          addAlert(humanReadableError(error), "error");
        } else {
          setListing(data);
        }
      } catch (err) {
        addAlert(humanReadableError(err), "error");
      }
    };
    fetchListing();
  }, [id]);

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/")}>Home</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate("/listings/1")}>
          Listings
        </Breadcrumb.Item>
        {listing && <Breadcrumb.Item active>{listing.name}</Breadcrumb.Item>}
      </Breadcrumb>

      {listing && id ? (
        <RenderListing listing={listing} />
      ) : (
        <Container
          fluid
          className="d-flex justify-content-center align-items-center"
          style={{ height: "100vh" }}
        >
          <Row className="w-100">
            <Col className="d-flex justify-content-center align-items-center">
              <Spinner animation="border" />
            </Col>
          </Row>
        </Container>
      )}
    </>
  );
};

export default ListingDetails;
