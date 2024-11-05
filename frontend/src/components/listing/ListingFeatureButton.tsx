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

  const hasPermission = auth.currentUser?.permissions?.some(
    (permission) =>
      permission === "is_content_manager" || permission === "is_admin",
  );

  if (!hasPermission) {
    return null;
  }

  useEffect(() => {
    setIsFeatured(initialFeatured);
  }, [initialFeatured]);

  const handleFeatureToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsUpdating(true);

    try {
      const response = await auth.client.PUT(
        "/listings/featured/{listing_id}",
        {
          params: {
            path: { listing_id: listingId },
            query: { featured: !isFeatured },
          },
        },
      );

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
    <div className="flex items-center gap-2 mt-2">
      <Button
        onClick={handleFeatureToggle}
        variant="primary"
        disabled={isUpdating}
        title={
          currentFeaturedCount >= 3 && !isFeatured
            ? "Maximum of 3 featured listings allowed. Unfeature another listing first."
            : isFeatured
              ? "Remove from featured"
              : "Add to featured"
        }
        className="flex items-center"
      >
        <FaStar className="mr-2 h-4 w-4" />
        <span className="mr-2">
          {isUpdating ? "Updating..." : isFeatured ? "Unfeature" : "Feature"}
        </span>
      </Button>
    </div>
  );
};

export default ListingFeatureButton;
