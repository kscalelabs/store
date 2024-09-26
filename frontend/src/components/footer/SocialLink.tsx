import { FC, ReactNode } from "react";

interface SocialLinkProps {
  href: string;
  ariaLabel: string;
  bgColor?: string;
  ringColor: string;
  children: ReactNode; // social link icon
  className?: string;
}

const SocialLink: FC<SocialLinkProps> = ({
  href,
  ariaLabel,
  bgColor,
  ringColor,
  children,
  className,
}) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        rounded-full
        text-gray-1
        bg-gray-12
        hover:text-gray-12
        hover:bg-gray-1
        cursor-pointer
        focus:outline-none
        focus:ring-2 focus:ring-offset-2 ${ringColor}
        ${className}

      `}
      style={{ backgroundColor: bgColor }}
    >
      <button className="text-xl p-2 rounded-full" aria-label={ariaLabel}>
        {children}
      </button>
    </a>
  );
};

export default SocialLink;
