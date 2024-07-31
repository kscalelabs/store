import { humanReadableError } from "constants/backend";
import { paths } from "gen/api";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import {
  Breadcrumb,
  Card,
  Col,
  Container,
  Row,
  Spinner,
} from "react-bootstrap";
import Markdown from "react-markdown";
import { Link, useNavigate, useParams } from "react-router-dom";

type ListingsType =
  paths["/listings/me"]["get"]["responses"][200]["content"]["application/json"]["listings"];

const MyListings = () => {
  const auth = useAuthentication();
  const [partsData, setListings] = useState<ListingsType | null>(null);
  const { addAlert } = useAlertQueue();
  const { page } = useParams();
  const [moreListings, setMoreListings] = useState<boolean>(false);

  const pageNumber = parseInt(page || "1", 10);

  if (isNaN(pageNumber) || pageNumber < 0) {
    return (
      <>
        <h1>Robots</h1>
        <p>Invalid page number in URL.</p>
      </>
    );
  }

  useEffect(() => {
    const fetch_parts = async () => {
      // const partsQuery = await auth_api.getMyListings(pageNumber);
      const { data, error } = await auth.client.GET("/listings/me", {
        params: {
          query: {
            page: pageNumber,
          },
        },
      });

      if (error) {
        addAlert(humanReadableError(error), "error");
      } else {
        setListings(data.listings);
        setMoreListings(data.has_next);
      }
    };
    fetch_parts();
  }, []);

  const navigate = useNavigate();

  if (!partsData) {
    return (
      <Container
        fluid
        className="d-flex justify-content-center align-items-center mt-5"
      >
        <Row className="w-100">
          <Col className="d-flex justify-content-center align-items-center">
            <Spinner animation="border" />
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/")}>Home</Breadcrumb.Item>
        <Breadcrumb.Item active>My Listings</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="mt-5">
        {partsData.map((part) => (
          <Col key={part.id} lg={2} md={3} sm={6} xs={12}>
            <Card onClick={() => navigate(`/listing/${part.id}`)}>
              <Card.Body>
                <Card.Title>{part.name}</Card.Title>
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
                    {part.description}
                  </Markdown>
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      {(pageNumber > 1 || moreListings) && (
        <Row className="mt-3">
          {pageNumber > 1 && (
            <Col>
              <Link to={"/listings/me/" + (pageNumber - 1)}>Previous Page</Link>
            </Col>
          )}
          {moreListings && (
            <Col className="text-end">
              <Link to={"/listings/me/" + (pageNumber + 1)}>Next Page</Link>
            </Col>
          )}
        </Row>
      )}
    </>
  );
};

export default MyListings;
