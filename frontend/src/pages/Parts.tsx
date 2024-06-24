import ImageComponent from "components/files/ViewImage";
import { SearchInput } from "components/ui/Search/SearchInput";
import { useAlertQueue } from "hooks/alerts";
import { api, Part } from "hooks/api";
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

const Parts = () => {
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  const [partsData, setParts] = useState<Part[] | null>(null);
  const [moreParts, setMoreParts] = useState<boolean>(false);
  const [idMap, setIdMap] = useState<Map<string, string>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleSearchBarInput, setVisibleSearchBarInput] = useState("");
  const { addAlert } = useAlertQueue();
  const { page } = useParams();

  const pageNumber = parseInt(page || "", 10);
  if (isNaN(pageNumber) || pageNumber < 0) {
    return (
      <>
        <h1>Parts</h1>
        <p>Invalid page number in URL.</p>
      </>
    );
  }

  function handleSearch() {
    const searchQuery = visibleSearchBarInput;
    setSearchQuery(searchQuery);
  }

  const handleSearchInputEnterKey = (query: string) => {
    setVisibleSearchBarInput(query);
    handleSearch();
  };

  useEffect(() => {
    const fetch_robots = async () => {
      try {
        const partsQuery = await auth_api.getParts(pageNumber, searchQuery);
        setMoreParts(partsQuery[1]);
        const parts = partsQuery[0];
        setParts(parts);
        const ids = new Set<string>();
        parts.forEach((part) => {
          ids.add(part.owner);
        });
        if (ids.size > 0)
          setIdMap(await auth_api.getUserBatch(Array.from(ids)));
      } catch (err) {
        if (err instanceof Error) {
          addAlert(err.message, "error");
        } else {
          addAlert("An unexpected error occurred", "error");
        }
      }
    };
    fetch_robots();
  }, [pageNumber, searchQuery]);
  const navigate = useNavigate();

  if (!partsData) {
    return (
      <Container
        fluid
        className="d-flex justify-content-center align-items-center mt-5"
      >
        <Row className="w-0">
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
        <Breadcrumb.Item active>Parts</Breadcrumb.Item>
      </Breadcrumb>
      <SearchInput
        userInput={visibleSearchBarInput}
        onChange={(e) => setVisibleSearchBarInput(e.target.value)}
        onSearch={handleSearchInputEnterKey}
      />

      <Row className="mt-5">
        {partsData.map((part) => (
          <Col key={part.part_id} lg={2} md={3} sm={6} xs={12}>
            <Card onClick={() => navigate(`/part/${part.part_id}`)}>
              {part.images[0] && (
                <div
                  style={{
                    aspectRatio: "1/1",
                    width: "100%",
                    overflow: "hidden",
                    borderTopLeftRadius: ".25rem",
                    borderTopRightRadius: ".25rem",
                  }}
                >
                  <ImageComponent imageId={"mini" + part.images[0].url} />
                </div>
              )}
              <Card.Body>
                <Card.Title>{part.name}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {idMap.get(part.owner) || "Unknown"}
                </Card.Subtitle>
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
      {(pageNumber > 1 || moreParts) && (
        <Row className="mt-3">
          {pageNumber > 1 && (
            <Col>
              <Link to={"/parts/" + (pageNumber - 1)}>Previous Page</Link>
            </Col>
          )}
          {moreParts && (
            <Col className="text-end">
              <Link to={"/parts/" + (pageNumber + 1)}>Next Page</Link>
            </Col>
          )}
        </Row>
      )}
    </>
  );
};

export default Parts;
