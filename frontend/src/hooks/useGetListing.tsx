import { paths } from "gen/api";
import { useEffect, useState } from "react";
import { useAlertQueue } from "./alerts";
import { useAuthentication } from "./auth";

type ListingResponse =
  paths["/listings/{id}"]["get"]["responses"][200]["content"]["application/json"];

const useGetListing = (id: string) => {
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();
  const [listing, setListing] = useState<ListingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await auth.client.GET("/listings/{id}", {
          params: {
            path: { id },
          },
        });
        if (error) {
          addErrorAlert(error);
        } else {
          setListing(data);
        }
      } catch (err) {
        addErrorAlert(err);
        setError(error);
      }
      setIsLoading(false);
    };
    fetchListing();
  }, []);

  return {
    listing,
    isLoading,
    error,
  };
};

export default useGetListing;
