import { useNavigate } from "react-router-dom";

import Modal from "@/components/ui/Modal";
import { useAuthentication } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";
import { DollarSign, Share2, ShoppingBag } from "lucide-react";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateListingModal = ({ isOpen, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const auth = useAuthentication();
  const canSell = auth.currentUser?.stripe_connect?.onboarding_completed;

  const handleOptionClick = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      size="xl"
      className="sm:max-w-[600px]"
    >
      <div className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">What would you like to do?</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() =>
              handleOptionClick(
                `${ROUTES.BOTS.path}/${ROUTES.BOTS.$.CREATE.relativePath}`,
              )
            }
            className="flex flex-col items-center justify-center p-6 rounded-lg border border-gray-7 hover:border-gray-1 hover:bg-gray-11 cursor-pointer transition-all"
          >
            <Share2 className="w-12 h-12 mb-4" />
            <h3 className="text-lg font-semibold">Share a Robot</h3>
            <p className="text-sm text-gray-7 text-center mt-2">
              Share your Robot with the community
            </p>
          </div>

          {!canSell ? (
            <div
              onClick={() => handleOptionClick(ROUTES.SELL.ONBOARDING.path)}
              className="flex flex-col items-center justify-center p-6 rounded-lg border border-gray-7 hover:border-gray-1 hover:bg-gray-11 cursor-pointer transition-all"
            >
              <DollarSign className="w-12 h-12 mb-4" />
              <h3 className="text-lg font-semibold">Sell Robots</h3>
              <p className="text-sm text-gray-7 text-center mt-2">
                Complete onboarding to start selling robots
              </p>
            </div>
          ) : (
            <div
              onClick={() =>
                handleOptionClick(
                  `${ROUTES.BOTS.path}/${ROUTES.BOTS.$.SELL.relativePath}`,
                )
              }
              className="flex flex-col items-center justify-center p-6 rounded-lg border border-gray-7 hover:border-gray-1 hover:bg-gray-11 cursor-pointer transition-all"
            >
              <ShoppingBag className="w-12 h-12 mb-4" />
              <h3 className="text-lg font-semibold">Sell a Robot</h3>
              <p className="text-sm text-gray-7 text-center mt-2">
                List your Robot for sale
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CreateListingModal;
