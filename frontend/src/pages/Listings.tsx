import { SearchInput } from "components/ui/Search/SearchInput";
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
  paths["/listings/search"]["get"]["responses"][200]["content"]["application/json"]["listings"];

const Listings = () => {
  const auth = useAuthentication();
  const [partsData, setListings] = useState<ListingsType | null>(null);
  const [moreListings, setMoreListings] = useState<boolean>(false);
  const [idMap, setIdMap] = useState<Map<string, string>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleSearchBarInput, setVisibleSearchBarInput] = useState("");
  const { addAlert } = useAlertQueue();
  const { page } = useParams();

  const pageNumber = parseInt(page || "", 10);
  if (isNaN(pageNumber) || pageNumber < 0) {
    return (
      <>
        <h1>Listings</h1>
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
      const { data, error } = await auth.client.GET("/listings/search", {
        params: {
          query: {
            page: pageNumber,
            search_query: searchQuery,
          },
        },
      });

      if (error) {
        addAlert(humanReadableError(error), "error");
        return;
      }

      setListings(data.listings);
      setMoreListings(data.has_next);
      const ids = new Set<string>();
      data.listings.forEach((part) => {
        ids.add(part.user_id);
      });

      if (ids.size > 0) {
        const { data, error } = await auth.client.GET("/users/batch", {
          params: {
            query: {
              ids: Array.from(ids),
            },
          },
        });

        if (error) {
          addAlert(humanReadableError(error), "error");
          return;
        }

        const idMap = new Map<string, string>();
        data.users.forEach((user) => {
          idMap.set(user.id, user.email);
        });
        setIdMap(idMap);
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
        <Breadcrumb.Item active>Listings</Breadcrumb.Item>
      </Breadcrumb>
      <SearchInput
        userInput={visibleSearchBarInput}
        onChange={(e) => setVisibleSearchBarInput(e.target.value)}
        onSearch={handleSearchInputEnterKey}
      />

      <Row className="mt-5">
        {partsData.map((part) => (
          <Col key={part.id} lg={2} md={3} sm={6} xs={12}>
            <Card onClick={() => navigate(`/listing/${part.id}`)}>
              <Card.Body>
                <Card.Title>{part.name}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {idMap.get(part.user_id) || "Unknown"}
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
      {(pageNumber > 1 || moreListings) && (
        <Row className="mt-3">
          {pageNumber > 1 && (
            <Col>
              <Link to={"/listings/" + (pageNumber - 1)}>Previous Page</Link>
            </Col>
          )}
          {moreListings && (
            <Col className="text-end">
              <Link to={"/listings/" + (pageNumber + 1)}>Next Page</Link>
            </Col>
          )}
        </Row>
      )}
    </>
  );
};

export default Listings;
