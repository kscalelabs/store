import { useDebounce } from "@uidotdev/usehooks";
import ListingGrid from "components/listings/ListingGrid";
import { Input } from "components/ui/Input/Input";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";

const Listings = () => {
  const auth = useAuthentication();
  const [listingIds, setListingIds] = useState<string[] | null>(null);
  const [moreListings, setMoreListings] = useState<boolean>(false);
  const { addErrorAlert } = useAlertQueue();

  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();

  // Gets the current page number and makes sure it is valid.
  const page = searchParams.get("page");
  const query = searchParams.get("query");
  const pageNumber = parseInt(page || "1", 10);
  if (isNaN(pageNumber) || pageNumber < 0) {
    navigate("/404");
  }

  const [searchQuery, setSearchQuery] = useState(query || "");
  const debouncedSearch = useDebounce(searchQuery, 300);
  useEffect(() => {
    handleSearch();
  }, [debouncedSearch]);

  const handleSearch = async () => {
    setListingIds(null);

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
    } else {
      setListingIds(data.listing_ids);
      setMoreListings(data.has_next);
    }
  };

  const prevButton = pageNumber > 1;
  const nextButton = moreListings;
  const hasButton = prevButton || nextButton;

  return (
    <>
      <div className="flex justify-center mt-4">
        <div className="relative">
          <Input
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value === "") {
                setSearchParams({});
              } else {
                setSearchParams({ query: e.target.value });
              }
            }}
            value={searchQuery}
            placeholder="Search listings..."
            className="w-64 sm:w-96"
          />
          {searchQuery.length > 0 && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <FaTimes
                onClick={() => {
                  setSearchQuery("");
                  setSearchParams({});
                }}
                className="cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
      {hasButton && (
        <div className="flex justify-center mt-4">
          <div className="inline-flex">
            {prevButton && (
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"
                onClick={() => navigate(`/listings/${pageNumber - 1}`)}
              >
                Previous
              </button>
            )}
            {nextButton && (
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r"
                onClick={() => navigate(`/listings/${pageNumber + 1}`)}
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}
      <ListingGrid listingIds={listingIds} />
    </>
  );
};

export default Listings;
