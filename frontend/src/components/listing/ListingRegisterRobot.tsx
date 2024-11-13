import { useState } from "react";
import { FaPlus } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { useAuthentication } from "@/hooks/useAuth";

import { RegisterRobotModal } from "../modals/RegisterRobotModal";

interface Props {
  listingId: string;
}

const ListingRegisterRobot = ({ listingId }: Props) => {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const { isAuthenticated } = useAuthentication();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <Button
        variant="default"
        className="flex items-center"
        onClick={() => setIsRegisterModalOpen(true)}
      >
        <FaPlus className="mr-2 h-4 w-4" />
        <span className="mr-2">Create Robot Instance</span>
      </Button>

      <RegisterRobotModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        listingId={listingId}
      />
    </div>
  );
};

export default ListingRegisterRobot;
