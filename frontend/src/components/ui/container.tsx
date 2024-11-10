import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

const Container = (props: ContainerProps) => {
  return (
    <div className={cn("pt-6 max-w-7xl mx-auto", props.className)}>
      {props.children}
    </div>
  );
};

export default Container;
