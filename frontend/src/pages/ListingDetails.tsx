import ListingArtifacts from "components/listing/ListingArtifacts";
import ListingChildren from "components/listing/ListingChildren";
import ListingDeleteButton from "components/listing/ListingDeleteButton";
import ListingDescription from "components/listing/ListingDescription";
import ListingTitle from "components/listing/ListingTitle";
import Breadcrumbs from "components/ui/Breadcrumb/Breadcrumbs";
import { paths } from "gen/api";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import { Col, Container, Row, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";

type ListingResponse =
  paths["/listings/{id}"]["get"]["responses"][200]["content"]["application/json"];

interface RenderListingProps {
  listing: ListingResponse;
}

const RenderListing = (props: RenderListingProps) => {
  const { listing } = props;
  return (
    <Col>
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
    </Col>
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
          { label: listing?.name || "", onClick: undefined },
        ]}
      />

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
