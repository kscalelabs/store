import { FaSpinner } from "react-icons/fa";

const Spinner = (props: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div role="status" {...props}>
      <FaSpinner className="animate-spin" />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
