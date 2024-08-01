import { useDebounce } from "@uidotdev/usehooks";
import AddOrEditList from "components/listing/AddOrEditList";
import Breadcrumbs from "components/ui/Breadcrumb/Breadcrumbs";
import { Button } from "components/ui/Button/Button";
import { Input } from "components/ui/Input/Input";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const Listings = () => {
  const auth = useAuthentication();
  const [listingIds, setListingIds] = useState<string[] | null>(null);
  const [moreListings, setMoreListings] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { addErrorAlert } = useAlertQueue();
  const [showDialogBox, setShowDialogBox] = useState(false);
  const navigate = useNavigate();

  const debouncedSearch = useDebounce(searchQuery, 300);
  useEffect(() => {
    handleSearch();
  }, [debouncedSearch]);

  // Gets the current page number and makes sure it is valid.
  const { page } = useParams();
  const pageNumber = parseInt(page || "1", 10);
  if (isNaN(pageNumber) || pageNumber < 0) {
    navigate("/404");
  }

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
      <Breadcrumbs
        items={[
          { label: "Home", onClick: () => navigate("/") },
          { label: "Listings" },
        ]}
      />
      <div className="flex mt-4 w-full justify-between items-center">
        <div className="flex justify-center w-full">
          <Input
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search listings..."
            className="w-[500px]"
          />
        </div>
        <div className="flex justify-end w-auto ml-auto">
          <Button onClick={() => setShowDialogBox(true)}>+ New List</Button>
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
      <AddOrEditList
        open={showDialogBox}
        onClose={setShowDialogBox}
        listingIds={listingIds}
      />
    </>
  );
};

export default Listings;
