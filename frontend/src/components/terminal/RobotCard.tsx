import { useState } from "react";
import { FaExternalLinkAlt, FaRobot, FaTrash } from "react-icons/fa";
import { Link } from "react-router-dom";

import { SingleRobotResponse } from "@/components/terminal/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import ROUTES from "@/lib/types/routes";
import { formatDate } from "@/lib/utils/formatDate";

import { DeleteRobotModal } from "../modals/DeleteRobotModal";
import { Tooltip } from "../ui/ToolTip";

interface RobotCardProps {
  robot: SingleRobotResponse;
  onDeleteRobot: (robotId: string) => Promise<void>;
}

export default function RobotCard({ robot, onDeleteRobot }: RobotCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <Card className="p-6 bg-gray-2 border-gray-4">
      <div className="flex items-start justify-between">
        <Link
          to={ROUTES.TERMINAL.WITH_ID.buildPath({ id: robot.robot_id })}
          className="flex items-center gap-4 group flex-grow hover:cursor-pointer"
        >
          <div className="p-2 bg-gray-4 rounded-lg group-hover:bg-gray-5">
            <FaRobot className="h-6 w-6 text-gray-11" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-12 group-hover:text-primary-9">
              {robot.name}
            </h3>
          </div>
        </Link>
        <div className="flex gap-2">
          <Tooltip content="Delete robot">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <FaTrash className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {robot.description && (
        <p className="mt-4 text-sm text-gray-11">{robot.description}</p>
      )}

      <div className="mt-4 pt-4 border-t border-gray-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-11">Listing</p>
            <Tooltip
              content="View listing associated with robot"
              position="bottom"
            >
              <Link
                to={ROUTES.BOT.buildPath({
                  username: robot.username,
                  slug: robot.slug,
                })}
                className="text-gray-12 underline hover:text-primary-9 flex items-center gap-1 group"
              >
                <span className="group-hover:underline">
                  {robot.username}/{robot.slug}
                </span>
                <FaExternalLinkAlt className="h-3 w-3" />
              </Link>
            </Tooltip>
          </div>
          <div>
            <p className="text-gray-11">Registered</p>
            <p className="text-gray-12">
              {formatDate(new Date(robot.created_at * 1000))}
            </p>
          </div>
          <div>
            <p className="text-gray-11">Order ID</p>
            {robot.order_id ? (
              <Tooltip
                content="View order associated with robot"
                position="bottom"
              >
                <Link
                  to={ROUTES.ORDERS.path}
                  className="text-gray-12 underline hover:text-primary-9 flex items-center gap-1 group"
                >
                  <span className="group-hover:underline">
                    {robot.order_id}
                  </span>
                  <FaExternalLinkAlt className="h-3 w-3" />
                </Link>
              </Tooltip>
            ) : (
              <p className="text-gray-12">No associated order</p>
            )}
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
