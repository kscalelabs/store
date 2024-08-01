import { FaSpinner } from "react-icons/fa";

interface Props extends React.HTMLAttributes<HTMLDivElement> {}

const Spinner = (props: Props) => {
  return (
    <div role="status" {...props}>
      <FaSpinner className="animate-spin" />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
