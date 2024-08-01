import { paths } from "gen/api";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import { Col, Row, Spinner } from "react-bootstrap";
import ListingGridCard from "./ListingGridCard";

type ListingInfo =
  paths["/listings/batch"]["get"]["responses"][200]["content"]["application/json"]["listings"];

interface Props {
  listingIds: string[] | null;
}

const ListingGrid = (props: Props) => {
  const { listingIds } = props;
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const [listingInfo, setListingInfoResponse] = useState<ListingInfo | null>(
    null,
  );

  useEffect(() => {
    if (listingIds !== null && listingIds.length > 0) {
      (async () => {
        console.log("LISTING IDS:", listingIds);
        const { data, error } = await auth.client.GET("/listings/batch", {
          params: {
            query: {
              ids: listingIds,
            },
          },
        });

        if (error) {
          addErrorAlert(error);
          return;
        }

        setListingInfoResponse(data.listings);
      })();
    }
  }, [listingIds]);

  return (
    <Row className="mt-5">
      {listingIds === null ? (
        <Col className="text-center">
          <Spinner animation="border" />
        </Col>
      ) : (
        listingIds.map((listingId) => (
          <Col key={listingId} lg={2} md={3} sm={6} xs={12}>
            <ListingGridCard listingId={listingId} listingInfo={listingInfo} />
          </Col>
        ))
      )}
    </Row>
  );
};

export default ListingGrid;
