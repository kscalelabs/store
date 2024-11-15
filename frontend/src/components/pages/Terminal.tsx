import React, { useEffect, useState } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import TerminalAllRobots from "@/components/terminal/TerminalAllRobots";
import TerminalSingleRobot from "@/components/terminal/TerminalSingleRobot";
import { SingleRobotResponse } from "@/components/terminal/types";
import Spinner from "@/components/ui/Spinner";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";
import { FEATURE_FLAGS } from "@/lib/utils/featureFlags";

import RequireAuthentication from "../auth/RequireAuthentication";

interface TerminalInnerRouterProps {
  robots: SingleRobotResponse[];
  onDeleteRobot: (robotId: string) => Promise<void>;
  onUpdateRobot: (
    robotId: string,
    updates: { name?: string; description?: string },
  ) => Promise<void>;
}

const TerminalInnerRouter = ({
  robots,
  onDeleteRobot,
  onUpdateRobot,
}: TerminalInnerRouterProps) => {
  const { id: robotId } = useTypedParams(ROUTES.TERMINAL.WITH_ID);
  const robot = robots.find((robot) => robot.robot_id === robotId);

  return robot ? (
    <TerminalSingleRobot robot={robot} onUpdateRobot={onUpdateRobot} />
  ) : (
    <TerminalAllRobots robots={robots} onDeleteRobot={onDeleteRobot} />
  );
};

const TerminalInner = () => {
  const { api, currentUser, isAuthenticated } = useAuthentication();
  const [robots, setRobots] = useState<SingleRobotResponse[] | null>(null);
  const { addErrorAlert } = useAlertQueue();

  const demoRobot: SingleRobotResponse = {
    robot_id: "d38afe50c9d6b936",
    name: "K-Scale Demo",
    description: "Click on the robot name to start the demo!",
    listing_id: "3f26c2bc2c072f50",
    user_id: "",
    username: "kscale",
    slug: "k-bot",
    created_at: Date.now() / 1000,
  };

  useEffect(() => {
    const fetchRobots = async () => {
      if (isAuthenticated && currentUser) {
        try {
          const { data, error } = await api.client.GET("/robots/list");
          if (error) {
            addErrorAlert(error);
          } else if (data.robots.length > 0) {
            setRobots(data.robots);
            return;
          }
        } catch (error) {
          addErrorAlert(error);
        }
      }

      if (FEATURE_FLAGS.DEMO_ROBOT_ENABLED) {
        setRobots([demoRobot]);
        return;
      }

      setRobots(null);
    };

    fetchRobots();
  }, [api, currentUser, isAuthenticated]);

  const handleDeleteRobot = async (robotId: string) => {
    if (FEATURE_FLAGS.DEMO_ROBOT_ENABLED && robotId === "3688c9a4af0b58e1") {
      addErrorAlert("Demo robot cannot be deleted");
      return;
    }

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
        prev ? prev.filter((robot) => robot.robot_id !== robotId) : prev,
      );
    } catch (error) {
      addErrorAlert(error);
    }
  };

  const handleUpdateRobot = async (
    robotId: string,
    updates: { name?: string; description?: string },
  ) => {
    if (FEATURE_FLAGS.DEMO_ROBOT_ENABLED && robotId === "3688c9a4af0b58e1") {
      addErrorAlert("Demo robot cannot be modified");
      return;
    }

    try {
      const { error } = await api.client.PUT("/robots/update/{robot_id}", {
        params: {
          path: { robot_id: robotId },
        },
        body: updates,
      });

      if (error) {
        addErrorAlert(error);
      } else {
        setRobots(
          (prev) =>
            prev?.map((robot) =>
              robot.robot_id === robotId ? { ...robot, ...updates } : robot,
            ) ?? null,
        );
      }
    } catch (error) {
      addErrorAlert(error);
    }
  };

  return robots === null ? (
    <div className="flex justify-center items-center pt-10">
      <Spinner />
    </div>
  ) : (
    <TerminalInnerRouter
      robots={robots}
      onDeleteRobot={handleDeleteRobot}
      onUpdateRobot={handleUpdateRobot}
    />
  );
};

const Terminal: React.FC = () => {
  return (
    <RequireAuthentication allowDemo={true}>
      <TerminalInner />
    </RequireAuthentication>
  );
};

export default Terminal;
