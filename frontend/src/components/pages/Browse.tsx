import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";

import ListingGrid from "@/components/listings/ListingGrid";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { components } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { useDebounce } from "@uidotdev/usehooks";

type SortOption = components["schemas"]["SortOption"];

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
  const [sortOption, setSortOption] = useState<SortOption>("most_upvoted");

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
          sort_by: sortOption,
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

  const options: { value: SortOption; label: string }[] = [
    { value: "most_upvoted", label: "Most Upvoted" },
    { value: "most_viewed", label: "Most Viewed" },
    { value: "newest", label: "Newest" },
  ];

  return (
    <>
      <div className="py-8">
        <div className="flex flex-col md:flex-row justify-center items-center gap-2">
          <div className="relative w-full md:w-auto">
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
              className="w-full md:w-96"
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
          <div className="w-full md:w-auto flex flex-col md:flex-row gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg" className="w-full md:w-1/2">
                  Sort By:{" "}
                  {options.find((opt) => opt.value === sortOption)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
                {options.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={sortOption === option.value}
                    onCheckedChange={() => setSortOption(option.value)}
                    className={`text-gray-11 cursor-pointer ${sortOption === option.value ? "text-gray-12 bg-gray-3" : ""}`}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={() => navigate(`/create`)}
              variant="primary"
              size="lg"
              className="w-full md:w-auto"
            >
              Create
            </Button>
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="default"
            onClick={() => navigate(`/browse/?page=${pageNumber - 1}`)}
            disabled={!prevButton}
          >
            <div className="flex items-center">
              <FaChevronLeft className="text-xs mr-2" />
              Previous
            </div>
          </Button>
          <Button
            variant="default"
            onClick={() => navigate(`/browse/?page=${pageNumber + 1}`)}
            disabled={!nextButton}
          >
            <div className="flex items-center">
              Next
              <FaChevronRight className="text-xs ml-2" />
            </div>
          </Button>
        </div>
      </div>

      <ListingGrid listingIds={listingIds} />

      {listingIds && (
        <div className="flex justify-between mt-2">
          <Button
            variant="default"
            onClick={() => navigate(`/browse/?page=${pageNumber - 1}`)}
            disabled={!prevButton}
          >
            <div className="flex items-center">
              <FaChevronLeft className="text-xs mr-2" />
              Previous
            </div>
          </Button>
          <Button
            variant="default"
            onClick={() => navigate(`/browse/?page=${pageNumber + 1}`)}
            disabled={!nextButton}
          >
            <div className="flex items-center">
              Next
              <FaChevronRight className="text-xs ml-2" />
            </div>
          </Button>
        </div>
      )}
    </>
  );
};

export default Browse;
