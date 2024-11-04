import { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

interface Props {
  listingId: string;
  initialFeatured: boolean;
  onFeatureToggle?: () => void;
  currentFeaturedCount?: number;
}

const ListingFeatureButton = (props: Props) => {
  const {
    listingId,
    initialFeatured,
    onFeatureToggle,
    currentFeaturedCount = 0,
  } = props;
  const [isFeatured, setIsFeatured] = useState(initialFeatured);
  const [isUpdating, setIsUpdating] = useState(false);

  const { addAlert, addErrorAlert } = useAlertQueue();
  const auth = useAuthentication();

  useEffect(() => {
    setIsFeatured(initialFeatured);
  }, [initialFeatured]);

  if (!auth.currentUser?.permissions?.includes("content_manager")) {
    return null;
  }

  if (currentFeaturedCount >= 3 && !isFeatured) {
    return null;
  }

  const handleFeatureToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsUpdating(true);

    try {
      const response = await auth.client.PUT("/listings/featured/{id}", {
        params: {
          path: { id: listingId },
          query: { featured: !isFeatured },
        },
      });

      if (response.error) {
        addErrorAlert(response.error);
      } else {
        const newFeaturedState = !isFeatured;
        setIsFeatured(newFeaturedState);
        addAlert(
          `Listing ${newFeaturedState ? "featured" : "unfeatured"} successfully`,
          "success",
        );

        window.dispatchEvent(
          new CustomEvent("featuredListingsChanged", {
            detail: {
              listingId,
              isFeatured: newFeaturedState,
            },
          }),
        );

        if (onFeatureToggle) {
          onFeatureToggle();
        }
      }
    } catch {
      addErrorAlert("Failed to update featured status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button
      onClick={handleFeatureToggle}
      variant={isFeatured ? "default" : "outline"}
      disabled={isUpdating}
      title={
        currentFeaturedCount >= 3 && !isFeatured
          ? "Maximum of 3 featured listings allowed. Unfeature another listing first."
          : isFeatured
            ? "Remove from featured"
            : "Add to featured"
      }
      className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-all duration-300 ${
        isFeatured
          ? "bg-yellow-500 hover:bg-yellow-600 text-white"
          : "bg-primary-9 hover:bg-primary-10 text-white"
      }`}
    >
      <FaStar className="text-lg" />
      <span>
        {isUpdating ? "Updating..." : isFeatured ? "Unfeature" : "Feature"}
      </span>
    </Button>
  );
};

export default ListingFeatureButton;
