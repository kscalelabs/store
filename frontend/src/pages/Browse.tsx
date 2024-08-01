import { useDebounce } from "@uidotdev/usehooks";
import AddOrEditList from "components/listing/AddOrEditList";
import List from "components/listing/List";
import { Button } from "components/ui/Button/Button";
import { Input } from "components/ui/Input/Input";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FormType } from "types";

const Browse = () => {
  const auth = useAuthentication();
  const [listingIds, setListingIds] = useState<string[] | null>(null);
  const [moreListings, setMoreListings] = useState<boolean>(false);
  const { addErrorAlert } = useAlertQueue();
  const [showDialogBox, setShowDialogBox] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [formType, setformType] = useState("");
  const [listId, setlistId] = useState("");
  const navigate = useNavigate();
  console.log(" lsiting id : ", listingIds);
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

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await auth.client.GET("/listings/me", {
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
    }
    fetchData();
  }, []);

  return (
    <>
      <div className="min-h-screen">
        <div className="flex justify-center mt-4 gap-x-2">
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
          <div>
            <Button
              variant={"primary"}
              onClick={() => {
                setShowDialogBox(true);
                setformType("create");
              }}
            >
              + New List
            </Button>
          </div>
        </div>

        {hasButton && (
          <div className="flex justify-center mt-4">
            <div className="inline-flex">
              {prevButton && (
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"
                  onClick={() => navigate(`/browse/${pageNumber - 1}`)}
                >
                  Previous
                </button>
              )}
              {nextButton && (
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r"
                  onClick={() => navigate(`/browse/${pageNumber + 1}`)}
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
        {showDialogBox && (
          <AddOrEditList
            listId={listId}
            formType={formType as FormType}
            open={showDialogBox}
            onClose={setShowDialogBox}
          />
        )}
        <div className="grid grid-cols-4 py-4 px-4 gap-4">
          {listingIds?.map((id) => (
            <List
              key={id}
              id={id}
              setShowDialogBox={setShowDialogBox}
              setformType={setformType}
              setlistId={setlistId}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Browse;
