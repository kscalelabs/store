import smallLogo from "@/images/small-logo.png";

const Logo = () => {
  return (
    <div className="flex items-center space-x-2 select-none">
      <img src={smallLogo} alt="K Scale Logo" className="h-6 invert" />
      <span className="text-lg font-bold text-gray-1 font-orbitron tracking-wider">
        K-Scale Labs
      </span>
    </div>
  );
};

export default Logo;
