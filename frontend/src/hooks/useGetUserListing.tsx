import { useEffect, useState } from "react";

import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

type ListingInfo =
  paths["/listings/me"]["get"]["responses"][200]["content"]["application/json"]["listings"][number];

const useGetUserListing = ({
  pageNumber,
  searchQuery,
}: {
  pageNumber: number;
  searchQuery: string;
}) => {
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();
  const [listingInfos, setListingInfos] = useState<ListingInfo[] | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(false);

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
        setListingInfos(data.listings);
        setHasNext(data.has_next);
      }
    }
    fetchData();
  }, [pageNumber, searchQuery, auth.client, addErrorAlert]);

  return {
    listingInfos,
    hasNext,
  };
};

export default useGetUserListing;
