import { useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";

import ListingGrid from "@/components/listings/ListingGrid";
import { CreateListingModal } from "@/components/modals/CreateListingModal";
import { Input } from "@/components/ui/Input/Input";
import Spinner from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import Container from "@/components/ui/container";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { components, paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { useDebounce } from "@uidotdev/usehooks";

type SortOption = components["schemas"]["SortOption"];

type ListingInfo =
  paths["/listings/search"]["get"]["responses"][200]["content"]["application/json"]["listings"][number];

const Browse = () => {
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();
  const [searchParams, setSearchParams] = useSearchParams();

  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [listingInfos, setListingInfos] = useState<ListingInfo[]>([]);

  const query = searchParams.get("query");
  const [searchQuery, setSearchQuery] = useState(query || "");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [sortOption, setSortOption] = useState<SortOption>("most_upvoted");

  const observerTarget = useRef<HTMLDivElement>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  useEffect(() => {
    handleSearch(true);
  }, [debouncedSearch, sortOption]);

  useEffect(() => {
    handleSearch();
  }, [page]);

  const handleSearch = async (resetSearch: boolean = false) => {
    if (isLoading) return;

    setIsLoading(true);
    const currentPage = resetSearch ? 1 : page;

    if (resetSearch) {
      setListingInfos([]);
      setPage(1);
      setHasMore(true);
    }

    const { data, error } = await auth.client.GET("/listings/search", {
      params: {
        query: {
          page: currentPage,
          search_query: searchQuery,
          sort_by: sortOption,
          include_user_vote: true,
        },
      },
    });

    if (error) {
      addErrorAlert(error);
    } else {
      const newListings = resetSearch
        ? data.listings
        : [...listingInfos, ...data.listings];
      const uniqueListings = Array.from(
        new Map(newListings.map((listing) => [listing.id, listing])).values(),
      );
      setListingInfos(uniqueListings);
      setHasMore(data.has_next);
    }
    setIsLoading(false);
  };

  const options: { value: SortOption; label: string }[] = [
    { value: "most_upvoted", label: "Most Upvoted" },
    { value: "most_viewed", label: "Most Viewed" },
    { value: "newest", label: "Newest" },
  ];

  return (
    <Container className="min-h-screen">
      <div className="mb-10">
        <div className="flex flex-col justify-center mb-6 text-center max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Community Robots Hub</h1>
          <p className="text-gray-2 text-xs sm:text-lg">
            Explore and share robot designs from the community! Upload your
            OnShape CAD models and instantly convert them to URDF and MJCF
            formats for simulation and visualization
          </p>
        </div>
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
              onClick={() => setShowCreateModal(true)}
              variant="outline"
              size="lg"
              className="w-full md:w-auto"
            >
              Create
            </Button>
          </div>
        </div>
      </div>

      <ListingGrid listingInfos={listingInfos} />

      <div ref={observerTarget} className="py-8 text-center">
        {isLoading && (
          <div className="flex items-center justify-center gap-2">
            <Spinner />
          </div>
        )}
      </div>

      <CreateListingModal
        isOpen={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </Container>
  );
};

export default Browse;
