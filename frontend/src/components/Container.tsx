import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface ContainerProps {
  children: ReactNode;
}

const Container = (props: ContainerProps) => {
  const { children } = props;
  const { pathname } = useLocation();

  // Landing page / home path.
  if (pathname === "/") {
    return <div>{children}</div>;
  }

  return <div className="container mx-auto pt-24 pb-16 px-8">{children}</div>;
};

export default Container;
