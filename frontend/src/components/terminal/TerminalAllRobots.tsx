import { useNavigate } from "react-router-dom";

import RobotCard from "@/components/terminal/RobotCard";
import { SingleRobotResponse } from "@/components/terminal/types";
import { Button } from "@/components/ui/button";

interface Props {
  robots: SingleRobotResponse[];
  onDeleteRobot: (robotId: string) => Promise<void>;
}

const TerminalAllRobots = ({ robots, onDeleteRobot }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="p-6 min-h-screen rounded-xl max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Terminal</h1>
        </div>
      </div>

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
        <div className="flex flex-col gap-4 justify-center items-center bg-gray-4 p-10 rounded-lg max-w-3xl mx-auto">
          <p className="text-gray-12 font-medium sm:text-lg">No robots yet.</p>
          <Button
            variant="primary"
            onClick={() => navigate("/browse")}
            className="flex items-center"
          >
            <span className="mr-2">Browse Listings</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default TerminalAllRobots;
