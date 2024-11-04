import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Spinner from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import { components, paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { ApiError } from "@/lib/types/api";

import RobotCard from "../robots/RobotCard";

type Robot = components["schemas"]["Robot"];
type ListingDetails =
  paths["/listings/batch"]["get"]["responses"][200]["content"]["application/json"]["listings"][number];

type ListingInfo = {
  username: string;
  slug: string | null;
  id: string;
};

const TerminalPage: React.FC = () => {
  const { api, currentUser, isAuthenticated, isLoading } = useAuthentication();
  const [robots, setRobots] = useState<Robot[] | null>(null);
  const [loadingRobots, setLoadingRobots] = useState(true);
  const { addErrorAlert } = useAlertQueue();
  const navigate = useNavigate();
  const [listingInfos, setListingInfos] = useState<Record<string, ListingInfo>>(
    {},
  );

  useEffect(() => {
    const fetchRobots = async () => {
      if (isAuthenticated && currentUser) {
        setLoadingRobots(true);
        try {
          const { data: robotsData, error } =
            await api.client.GET("/robots/list");
          if (error) {
            console.error("Failed to fetch robots", error);
          } else {
            setRobots(robotsData);

            // Get unique listing IDs
            const uniqueListingIds = Array.from(
              new Set(robotsData.map((robot) => robot.listing_id)),
            );

            if (uniqueListingIds.length > 0) {
              const { data: listingsData, error: listingsError } =
                await api.client.GET("/listings/batch", {
                  params: { query: { ids: uniqueListingIds } },
                });

              if (!listingsError) {
                const infos: Record<string, ListingInfo> = {};
                listingsData.listings.forEach((listing: ListingDetails) => {
                  infos[listing.id] = {
                    id: listing.id,
                    username: listing.username || "",
                    slug: listing.slug,
                  };
                });
                setListingInfos(infos);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching robots", error);
        } finally {
          setLoadingRobots(false);
        }
      }
    };

    fetchRobots();
  }, [api, currentUser, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="pt-8 min-h-screen">
        Please log in to view robots associated with your account.
      </div>
    );
  }

  const handleDeleteRobot = async (robotId: string) => {
    try {
      const { error } = await api.client.DELETE("/robots/delete/{robot_id}", {
        params: {
          path: { robot_id: robotId },
        },
      });

      if (error) {
        console.error("API Error:", error);
        const errorMessage =
          typeof error.detail === "string"
            ? error.detail
            : error.detail?.[0]?.msg || "Unknown error";

        addErrorAlert(`Failed to delete robot: ${errorMessage}`);
        throw error;
      }

      // Remove the deleted robot from the list
      setRobots((prev) =>
        prev ? prev.filter((robot) => robot.id !== robotId) : prev,
      );
    } catch (error) {
      console.error("Error deleting robot:", error);
      if (error && typeof error === "object" && "detail" in error) {
        const apiError = error as ApiError;
        const errorMessage =
          typeof apiError.detail === "string"
            ? apiError.detail
            : apiError.detail?.[0]?.msg || "Unknown error";
        addErrorAlert(`Failed to delete robot: ${errorMessage}`);
        throw error;
      } else {
        addErrorAlert("Failed to delete robot. Please try again.");
        throw error;
      }
    }
  };

  return (
    <div className="p-6 min-h-screen rounded-xl bg-gray-3 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Terminal</h1>
        </div>
      </div>

      {isLoading || loadingRobots ? (
        <div className="flex justify-center items-center bg-gray-4 p-4 md:p-10 rounded-lg max-w-md mx-auto">
          <Spinner className="p-1" />
        </div>
      ) : robots && robots.length > 0 ? (
        <div className="grid gap-2 md:gap-6 md:grid-cols-1 lg:grid-cols-2">
          {robots.map((robot) => (
            <RobotCard
              key={robot.id}
              robot={robot}
              listingInfo={listingInfos[robot.listing_id]}
              onDeleteRobot={handleDeleteRobot}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4 justify-center items-center bg-gray-4 p-10 rounded-lg max-w-3xl mx-auto">
          <p className="text-gray-12 font-medium sm:text-lg">No robots yet.</p>
          <Button
            variant="primary"
            onClick={() => navigate("/browse")}
            className="flex items-center"
          >
            <span className="mr-2">Browse Listings</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default TerminalPage;
