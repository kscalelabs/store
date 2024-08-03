import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface ContainerProps {
  children: ReactNode;
}

const Container = (props: ContainerProps) => {
  const { children } = props;
  const location = useLocation();
  const { pathname } = location;

  // Landing page/home path
  if (pathname === "/") {
    return <div className="pt-16">{children}</div>;
  }

  return <div className="container mx-auto pt-24 px-8">{children}</div>;
};

export default Container;
