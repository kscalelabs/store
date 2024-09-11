import { useEffect, useState } from "react";

import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

const useGetUserListing = ({
  pageNumber,
  searchQuery,
}: {
  pageNumber: number;
  searchQuery: string;
}) => {
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();
  const [listingIds, setListingIds] = useState<string[] | null>(null);
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
      }
    }
    fetchData();
  }, []);
  return {
    listingIds,
  };
};

export default useGetUserListing;
