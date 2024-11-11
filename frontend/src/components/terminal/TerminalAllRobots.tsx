import { useNavigate } from "react-router-dom";

import RobotCard from "@/components/terminal/RobotCard";
import { SingleRobotResponse } from "@/components/terminal/types";
import { Button } from "@/components/ui/button";
import Container from "@/components/ui/container";
import ROUTES from "@/lib/types/routes";

interface Props {
  robots: SingleRobotResponse[];
  onDeleteRobot: (robotId: string) => Promise<void>;
}

const TerminalAllRobots = ({ robots, onDeleteRobot }: Props) => {
  const navigate = useNavigate();

  return (
    <Container>
      {robots && robots.length > 0 ? (
        <div className="grid gap-2 md:gap-6 md:grid-cols-1 lg:grid-cols-2">
          {robots.map((robot) => (
            <RobotCard
              key={robot.robot_id}
              robot={robot}
              onDeleteRobot={onDeleteRobot}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4 justify-center items-center bg-gray-12 p-10 rounded-lg max-w-3xl mx-auto border border-white">
          <p className="text-gray-2 font-medium sm:text-lg">
            No robots registered.
          </p>
          <p className="text-gray-2">Register a robot to get started.</p>
          <Button
            variant="default"
            onClick={() => navigate(ROUTES.BOTS.BROWSE.path)}
            className="flex items-center bg-gray-12 text-white hover:bg-gray-8 border border-white"
          >
            <span>Browse Robots</span>
          </Button>
        </div>
      )}
    </Container>
  );
};

export default TerminalAllRobots;
