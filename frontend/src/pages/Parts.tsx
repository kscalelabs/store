import { api, Part } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import { Breadcrumb, Card, Col, Row, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Parts = () => {
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  const [partsData, setParts] = useState<Part[] | null>(null);
  const [idMap, setIdMap] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetch_parts = async () => {
      try {
        const partsQuery = await auth_api.getParts();
        setParts(partsQuery);
        const ids = new Set<string>();
        partsQuery.forEach((part) => {
          ids.add(part.owner);
        });
        const idMap = await Promise.all(
          Array.from(ids).map(async (id) => {
            return [id, await auth_api.getUserById(id)];
          }),
        );
        setIdMap(new Map(idMap.map(([key, value]) => [key, value])));
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

  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      navigate("/404"); // Redirect to a 404 page
    }
  }, [error, navigate]);

  if (!partsData) {
    return <Spinner animation="border" />;
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
                <Card.Title>{part.part_name}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {idMap.get(part.owner)}
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
