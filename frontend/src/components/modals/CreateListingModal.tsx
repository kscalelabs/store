import { useNavigate } from "react-router-dom";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthentication } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";
import { Share2, ShoppingBag } from "lucide-react";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateListingModal = ({ isOpen, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const auth = useAuthentication();
  const canSell = auth.currentUser?.stripe_connect_onboarding_completed;

  const handleOptionClick = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-gray-1 text-gray-12 border border-gray-3 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle>What would you like to do?</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 p-4">
          <div
            onClick={() =>
              handleOptionClick(
                `${ROUTES.BOTS.path}/${ROUTES.BOTS.$.CREATE.relativePath}`,
              )
            }
            className="flex flex-col items-center justify-center p-6 rounded-lg border border-gray-6 hover:border-gray-8 cursor-pointer transition-all"
          >
            <Share2 className="w-12 h-12 mb-4" />
            <h3 className="text-lg font-semibold">Share a Robot</h3>
            <p className="text-sm text-gray-11 text-center mt-2">
              Share your Robot with the community
            </p>
          </div>

          <div
            onClick={() =>
              canSell &&
              handleOptionClick(
                `${ROUTES.BOTS.path}/${ROUTES.BOTS.$.SELL.relativePath}`,
              )
            }
            className={`flex flex-col items-center justify-center p-6 rounded-lg border ${
              canSell
                ? "border-gray-6 hover:border-gray-8 cursor-pointer"
                : "border-gray-4 opacity-50 cursor-not-allowed"
            } transition-all`}
          >
            <ShoppingBag className="w-12 h-12 mb-4" />
            <h3 className="text-lg font-semibold">Sell a Robot</h3>
            <p className="text-sm text-gray-11 text-center mt-2">
              {canSell
                ? "List your Robot for sale"
                : "Complete Stripe onboarding to sell"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateListingModal;
