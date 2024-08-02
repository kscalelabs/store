import { Button } from "components/ui/Button/Button";
import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface Props {
  title: string;
  edit: boolean;
}

const CloseButton = () => {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate(-1)}
      variant="ghost"
      className="hover:bg-gray-200 dark:hover:bg-gray-700 bg-opacity-50"
    >
      <span className="md:hidden block mr-2">Close</span>
      <FaTimes />
    </Button>
  );
};

const ListingHeader = (props: Props) => {
  const { title } = props;
  return (
    <div className="relative border-b p-4">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center">
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <CloseButton />
      </div>
    </div>
  );
};

export default ListingHeader;
