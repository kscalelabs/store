import {api} from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import { Breadcrumb, Card, Col, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

interface Image {
  caption: string;
  url: string;
}

interface PurchaseLink {
  url: string;
  price: number;
  name: string;
}

interface UsedBy {
  name: string;
  id: string;
  stars: number;
}

interface Part {
  name: string;
  owner: string;
  description: string;
  images: Image[];
  part_id: string;
  used_by: UsedBy[];
  purchase_links: PurchaseLink[];
}

// interface PartsResponse {
//   parts: Part[];
// }

const Parts = () => {
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  const [partsData, setParts] = useState<Part[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetch_parts = async () => {
      try {
        const partsQuery = await auth_api.getParts();
        setParts(partsQuery);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred");
        }
      }
    };
    fetch_parts();
  }, []);
  // const response: PartsResponse = {
  //   parts: [
  //     {
  //       name: "RMD X8",
  //       owner: "MyActuator",
  //       description: "6:1 reduction ratio motor",
  //       part_id: "1",
  //       images: "https://media.robolist.xyz/rmd_x8.png",
  //     },
  //   ],
  // };

  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      navigate("/404"); // Redirect to a 404 page
    }
  }, [error, navigate]);

  if (!partsData) {
    return <p>Loading</p>;
  }

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/")}>Home</Breadcrumb.Item>
        <Breadcrumb.Item active>Parts</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="mt-5">
        {partsData.map((part) => (
          <Col key={part.part_id} md={3} sm={6} xs={12}>
            <Card onClick={() => navigate(`/part/${part.part_id}`)}>
              {part.images[0].url && (
                <Card.Img
                  style={{ aspectRatio: "1/1" }}
                  variant="top"
                  src={part.images[0].url}
                />
              )}
              <Card.Body>
                <Card.Title>{part.name}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {part.owner}
                </Card.Subtitle>
                <Card.Text>{part.description}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
};

export default Parts;
