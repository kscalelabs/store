import React from "react";

interface PageHeaderProps {
  title: string;
  subheading: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subheading }) => {
  return (
    <div
      className="relative flex flex-col items-center justify-center text-white py-20 px-4 rounded-lg mb-10"
      style={{
        backgroundColor: "hsla(202,0%,0%,1)",
        backgroundImage: `
          radial-gradient(at 0% 0%, hsla(358,65%,70%,1) 0px, transparent 50%),
          radial-gradient(at 61% 88%, hsla(106,81%,75%,1) 0px, transparent 50%),
          radial-gradient(at 98% 41%, hsla(299,64%,74%,1) 0px, transparent 50%),
          radial-gradient(at 35% 44%, hsla(216,94%,78%,1) 0px, transparent 50%),
          radial-gradient(at 69% 47%, hsla(247,67%,67%,1) 0px, transparent 50%),
          radial-gradient(at 47% 100%, hsla(122,68%,65%,1) 0px, transparent 50%)
        `,
      }}
    >
      <h1 className="text-5xl font-bold mb-4 tracking-tight">{title}</h1>
      <p className="text-xl max-w-md text-center tracking-wide">{subheading}</p>
    </div>
  );
};

export default PageHeader;
