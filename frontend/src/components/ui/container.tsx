interface ContainerProps {
  children: React.ReactNode;
}

const Container = (props: ContainerProps) => {
  return <div className="pt-6 max-w-7xl mx-auto">{props.children}</div>;
};

export default Container;
