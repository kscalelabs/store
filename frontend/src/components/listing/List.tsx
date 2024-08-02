import Image from "components/Image";
import { Skeleton } from "components/ui/Skeleton";
import { useAuthentication } from "hooks/auth";
import useGetListing from "hooks/useGetListing";
import { Pencil, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/ToolTip";

interface ListProps {
  id: string;
  setShowDialogBox: React.Dispatch<React.SetStateAction<boolean>>;
  setformType: React.Dispatch<React.SetStateAction<string>>;
  setlistId: React.Dispatch<React.SetStateAction<string>>;
}

const List = ({ id, setShowDialogBox, setformType, setlistId }: ListProps) => {
  const { isLoading, listing } = useGetListing(id);
  const auth = useAuthentication();

  const handleDelete = async (listing_id: string) => {
    // TODO: create a modal to confirm
    await auth.client.DELETE("/listings/delete/{listing_id}", {
      params: {
        path: { listing_id },
      },
    });
  };

  if (isLoading) {
    return (
      <div className="bg-transparent">
        <Skeleton className="h-44 w-70 bg-white" />
        <Skeleton className="h-6 w-70 mt-5 bg-white" />
        <Skeleton className="h-6 w-70 mt-5 bg-white" />
        <Skeleton className="h-5 w-70 mt-2 mb-5 bg-white" />
        <Skeleton className="h-3.5 w-70 mt-1 bg-white" />
        <Skeleton className="h-5 mt-3.5 w-20 bg-white" />
      </div>
    );
  }

  return (
    <Card className="flex flex-col max-w-sm rounded material-card bg-white justify-between">
      <Image />
      <div className="px-3 py-2">
        <CardHeader>
          <CardTitle className="text-gray-500 text-xl mb-3">
            {listing?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 text-base">{listing?.description}</p>
        </CardContent>
      </div>
      <div className="mx-4 mt-2 mb-4 flex justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Pencil
                className="text-gray-500 mr-2 cursor-pointer"
                size={20}
                onClick={() => {
                  setShowDialogBox(true);
                  setformType("edit");
                  setlistId(id);
                }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-black">Edit</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Trash
                className="text-red-500 mr-2 cursor-pointer"
                size={20}
                onClick={() => handleDelete(id)}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-black">Delete</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </Card>
  );
};

export default List;
