import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
}

const Container = (props: ContainerProps) => {
  const { children } = props;

  return (
    <div className="mt-[68px] mb-6 mx-4 sm:mx-6 md:mx-10 xl:mx-16 max-w-full">
      {children}
    </div>
  );
};

export default Container;
