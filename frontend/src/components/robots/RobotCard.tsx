import { useState } from "react";
import { Link } from "react-router-dom";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { components } from "@/gen/api";
import { formatDate } from "@/lib/utils/formatDate";
import { Bot, ExternalLink, Trash2 } from "lucide-react";

import { DeleteRobotModal } from "../modals/DeleteRobotModal";
import { Tooltip } from "../ui/ToolTip";

type RobotType = components["schemas"]["Robot"];

interface RobotCardProps {
  robot: RobotType;
  listingInfo?: {
    username: string;
    slug: string | null;
    id: string;
  };
  onDeleteRobot: (robotId: string) => Promise<void>;
}

export default function RobotCard({
  robot,
  listingInfo,
  onDeleteRobot,
}: RobotCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <Card className="p-6 bg-gray-2 border-gray-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-gray-4 rounded-lg">
            <Bot className="h-6 w-6 text-gray-11" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-12">{robot.name}</h3>
            <p className="text-sm text-gray-11">ID: {robot.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Tooltip content="Delete robot">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {robot.description && (
        <p className="mt-4 text-sm text-gray-11">{robot.description}</p>
      )}

      <div className="mt-4 pt-4 border-t border-gray-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-11">Listing</p>
            {listingInfo ? (
              <Tooltip
                content="View listing associated with robot"
                position="bottom"
              >
                <Link
                  to={`/item/${listingInfo.username}/${listingInfo.slug}`}
                  className="text-gray-12 underline hover:text-primary-9 flex items-center gap-1 group"
                >
                  <span className="group-hover:underline">
                    {listingInfo.username}/{listingInfo.slug}
                  </span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Tooltip>
            ) : (
              <p className="text-gray-12">{robot.listing_id}</p>
            )}
          </div>
          <div>
            <p className="text-gray-11">Order ID</p>
            {robot.order_id ? (
              <Tooltip
                content="View order associated with robot"
                position="bottom"
              >
                <Link
                  to={`/orders`}
                  className="text-gray-12 underline hover:text-primary-9 flex items-center gap-1 group"
                >
                  <span className="group-hover:underline">
                    {robot.order_id}
                  </span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Tooltip>
            ) : (
              <p className="text-gray-12">No associated order</p>
            )}
          </div>
          <div>
            <p className="text-gray-11">Registered</p>
            <p className="text-gray-12">
              {formatDate(new Date(robot.created_at * 1000))}
            </p>
          </div>
        </div>
      </div>

      <DeleteRobotModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={onDeleteRobot}
        robot={robot}
      />
    </Card>
  );
}
