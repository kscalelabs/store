import { useState } from "react";
import { FaPlus } from "react-icons/fa";

import { RegisterRobotModal } from "@/components/modals/RegisterRobotModal";
import { Button } from "@/components/ui/button";
import { useAuthentication } from "@/hooks/useAuth";
import { FEATURE_FLAGS } from "@/lib/utils/featureFlags";

interface Props {
  listingId: string;
  className?: string;
}

const ListingRegisterRobot = ({ listingId, className }: Props) => {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const { isAuthenticated, currentUser } = useAuthentication();

  const isAdmin = currentUser?.permissions?.includes("is_admin");

  return isAuthenticated && (isAdmin || FEATURE_FLAGS.ROBOT_REGISTRATION) ? (
    <div className="flex flex-col items-start gap-3 mt-2">
      <Button
        variant="outline"
        className={`flex items-center ${className}`}
        onClick={() => setIsRegisterModalOpen(true)}
      >
        <FaPlus className="mr-2 h-4 w-4" />
        <span className="mr-2">Create Robot Instance</span>
      </Button>

      <p className="text-xs text-gray-6">
        You can interact with your registered robots in the terminal.
      </p>

      <RegisterRobotModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        listingId={listingId}
      />
    </div>
  ) : null;
};

export default ListingRegisterRobot;
