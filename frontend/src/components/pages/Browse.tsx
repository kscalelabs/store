import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useDebounce } from "@uidotdev/usehooks";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";
import { SortOption } from "types/listings";

import ListingGrid from "components/listings/ListingGrid";
import { Button } from "components/ui/Button/Button";
import { Input } from "components/ui/Input/Input";
import { Select } from "components/ui/Select/Select";

const Browse = () => {
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
  const [sortOption, setSortOption] = useState("newest");

  useEffect(() => {
    handleSearch();
  }, [debouncedSearch, pageNumber, sortOption]);

  const handleSearch = async () => {
    setListingIds(null);

    const { data, error } = await auth.client.GET("/listings/search", {
      params: {
        query: {
          page: pageNumber,
          search_query: searchQuery,
          sort_by: sortOption as SortOption,
          include_user_vote: true,
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
      <div className="pb-8">
        <div className="flex justify-center mt-4 gap-x-2">
          <div>
            <Select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              options={[
                { value: "newest", label: "Newest" },
                { value: "most_viewed", label: "Most Viewed" },
                { value: "most_upvoted", label: "Most Upvoted" },
              ]}
              variant="default"
            />
          </div>
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
          <Button
            onClick={() => navigate(`/create`)}
            variant="primary"
            size="lg"
          >
            Create
          </Button>
        </div>

        {hasButton && (
          <div className="flex justify-center mt-4">
            {prevButton && (
              <button
                className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-300 font-bold py-2 px-4 rounded-l mr-auto"
                onClick={() => navigate(`/browse/?page=${pageNumber - 1}`)}
              >
                Previous
              </button>
            )}
            {nextButton && (
              <button
                className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-300 font-bold py-2 px-4 rounded-r ml-auto"
                onClick={() => navigate(`/browse/?page=${pageNumber + 1}`)}
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>

      <ListingGrid listingIds={listingIds} />
    </>
  );
};

export default Browse;
