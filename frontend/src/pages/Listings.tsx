import ListingGrid from "components/listings/ListingGrid";
import { SearchInput } from "components/ui/Search/SearchInput";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import { Breadcrumb } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";

const Listings = () => {
  const auth = useAuthentication();
  const [listingIds, setListingIds] = useState<string[] | null>(null);
  const [moreListings, setMoreListings] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleSearchBarInput, setVisibleSearchBarInput] = useState("");
  const { addErrorAlert } = useAlertQueue();

  const navigate = useNavigate();

  // Gets the current page number and makes sure it is valid.
  const { page } = useParams();
  const pageNumber = parseInt(page || "1", 10);
  if (isNaN(pageNumber) || pageNumber < 0) {
    navigate("/404");
  }

  function handleSearch() {
    setSearchQuery(visibleSearchBarInput);
  }

  const handleSearchInputEnterKey = (query: string) => {
    setVisibleSearchBarInput(query);
    handleSearch();
  };

  useEffect(() => {
    (async () => {
      const { data, error } = await auth.client.GET("/listings/search", {
        params: {
          query: {
            page: pageNumber,
            search_query: searchQuery,
          },
        },
      });

      if (error) {
        addErrorAlert(error);
        return;
      }

      setListingIds(data.listing_ids);
      setMoreListings(data.has_next);
    })();
  }, [pageNumber, searchQuery]);

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
      <ListingGrid listingIds={listingIds} />
    </>
  );
};

export default Listings;
