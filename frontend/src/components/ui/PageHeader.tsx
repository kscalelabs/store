import React from "react";

interface PageHeaderProps {
  title: string;
  subheading: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subheading }) => {
  return (
    <div className="relative flex flex-col items-center justify-center text-gray-1 bg-gray-12 py-20 px-4 rounded-lg mb-10">
      <h1 className="text-5xl font-bold mb-4 tracking-tight">{title}</h1>
      <p className="text-xl max-w-md text-center tracking-wide">{subheading}</p>
    </div>
  );
};

export default PageHeader;
