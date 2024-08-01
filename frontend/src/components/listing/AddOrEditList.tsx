import { zodResolver } from "@hookform/resolvers/zod";
import RequireAuthentication from "components/auth/RequireAuthentication";
import { Button } from "components/ui/Button/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import ErrorMessage from "components/ui/ErrorMessage";
import { Input } from "components/ui/Input/Input";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { SubmitHandler, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { NewListingSchema, NewListingType } from "types";

interface AddOrEditProps {
  open: boolean;
  onClose: (open: boolean) => void;
  listingIds: string[] | null;
}
const AddOrEditList = ({ open, onClose }: AddOrEditProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewListingType>({
    resolver: zodResolver(NewListingSchema),
  });
  const { addAlert, addErrorAlert } = useAlertQueue();
  const navigate = useNavigate();
  const auth = useAuthentication();
  const onSubmit: SubmitHandler<NewListingType> = async ({
    name,
    description,
  }: NewListingType) => {
    const { data: responseData, error } = await auth.client.POST(
      "/listings/add",
      {
        body: {
          name,
          description,
          child_ids: [],
        },
      },
    );

    if (error) {
      addErrorAlert(error);
    } else {
      addAlert("Listing added successfully", "success");
      navigate(`/listing/${responseData.listing_id}`);
    }
  };
  return (
    <RequireAuthentication>
      <div>
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New List</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 space-y-6"
            >
              <div>
                <Input placeholder="Name" type="text" {...register("name")} />
                {errors?.name && (
                  <ErrorMessage>{errors?.name?.message}</ErrorMessage>
                )}
              </div>
              <div className="relative">
                <textarea
                  placeholder="Description"
                  rows={4}
                  className="block p-2.5 w-full text-sm text-gray-900 rounded-lg borde focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  {...register("description")}
                />
                {errors?.description && (
                  <ErrorMessage>{errors?.description?.message}</ErrorMessage>
                )}
              </div>
              {/* Render Description
              {description && (
                <div className="relative">
                  <RenderDescription description={description} />
                </div>
              )} */}

              {/* Submit */}
              <div>
                <Button variant="default" type="submit">
                  Submit
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RequireAuthentication>
  );
};

export default AddOrEditList;
