import { useState } from "react";
import { FaPlus } from "react-icons/fa";

import { Button } from "@/components/ui/button";

import { RegisterRobotModal } from "../modals/RegisterRobotModal";

interface Props {
  listingId: string;
}

const ListingRegisterRobot = ({ listingId }: Props) => {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  return (
    <div className="flex flex-col items-start gap-3 mt-2">
      <Button
        variant="outline"
        className="flex items-center"
        onClick={() => setIsRegisterModalOpen(true)}
      >
        <FaPlus className="mr-2 h-4 w-4" />
        <span className="mr-2">Register Robot</span>
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
  );
};

export default ListingRegisterRobot;
