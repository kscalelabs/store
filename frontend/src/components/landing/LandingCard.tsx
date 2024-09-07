import React from "react";
import { FaArrowRight } from "react-icons/fa";

interface LandingCardProps {
  imageSrc: string;
  title: string;
  description: string;
  onClick: () => void;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const LandingCard: React.FC<LandingCardProps> = ({
  imageSrc,
  title,
  description,
  onClick,
  icon: Icon = FaArrowRight,
}) => {
  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-[1.01] hover:shadow-lg"
      onClick={onClick}
    >
      <img
        src={imageSrc}
        alt={title}
        className="w-full h-64 object-cover rounded-t-lg"
      />
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">
            {title}
          </h3>
          <Icon className="text-gray-600 dark:text-gray-300" />
        </div>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          {description}
        </p>
      </div>
    </div>
  );
};

export default LandingCard;
