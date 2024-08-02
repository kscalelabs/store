import { ReactNode } from "react";
import "./App.css";

interface ContainerProps {
  children: ReactNode;
}

const Container = (props: ContainerProps) => {
  const { children } = props;

  return <div className="container mx-auto pt-24 px-8">{children}</div>;
};

export default Container;
