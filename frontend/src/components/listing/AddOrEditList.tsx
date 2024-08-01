import { zodResolver } from "@hookform/resolvers/zod";
import RequireAuthentication from "components/auth/RequireAuthentication";
import { Button } from "components/ui/Button/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import ErrorMessage from "components/ui/ErrorMessage";
import { FileSvgDraw } from "components/ui/FileSvgDraw";
import { Input, TextArea } from "components/ui/Input/Input";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import useGetListing from "hooks/useGetListing";
import { Paperclip } from "lucide-react";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { FormType, NewListingSchema, NewListingType } from "types";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "../ui/FileUpload";

const dropZoneConfig = {
  maxFiles: 5,
  maxSize: 1024 * 1024 * 4,
  multiple: true,
};

interface AddOrEditProps {
  open: boolean;
  listId: string;
  onClose: (open: boolean) => void;
  formType: FormType;
}
const AddOrEditList = ({ open, onClose, listId, formType }: AddOrEditProps) => {
  const [files, setFiles] = useState<File[] | null>(null);
  const { addAlert, addErrorAlert } = useAlertQueue();
  const auth = useAuthentication();
  const { listing } = useGetListing(listId);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<NewListingType>({
    resolver: zodResolver(NewListingSchema),
  });

  if (listing && formType === "edit") {
    setValue("name", listing?.name);
    setValue("description", listing?.description ?? "");
  }

  const onSubmit: SubmitHandler<NewListingType> = async ({
    name,
    description,
  }: NewListingType) => {
    // TODO: change http according to formType and add files (imgs/urdf) to artifact
    const { error } = await auth.client.POST("/listings/add", {
      body: {
        name,
        description,
        child_ids: [],
      },
    });

    if (error) {
      addErrorAlert(error);
    } else {
      addAlert("Listing added successfully", "success");
      onClose(false);
      window.location.reload();
    }
  };

  return (
    <RequireAuthentication>
      <div>
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent className="bg-gray-950">
            <DialogHeader>
              <DialogTitle className="text-white text-center py-2">
                Add Robo Details
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 space-y-6"
            >
              <div>
                <Input
                  placeholder="Name"
                  type="text"
                  {...register("name")}
                  className="text-white"
                />
                {errors?.name && (
                  <ErrorMessage>{errors?.name?.message}</ErrorMessage>
                )}
              </div>
              <div className="relative">
                <TextArea
                  placeholder="Description"
                  rows={4}
                  className="block p-2.5 text-white w-full text-sm rounded-lg borde focus:ring-blue-500 focus:border-blue-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  {...register("description")}
                />
                {errors?.description && (
                  <ErrorMessage>{errors?.description?.message}</ErrorMessage>
                )}
              </div>
              <div>
                <FileUploader
                  value={files}
                  onValueChange={setFiles}
                  dropzoneOptions={dropZoneConfig}
                  className="relative bg-background rounded-lg p-2"
                >
                  <FileInput className="outline-dashed outline-1 outline-white">
                    <div className="flex items-center justify-center flex-col pt-3 pb-4 w-full ">
                      <FileSvgDraw />
                    </div>
                  </FileInput>
                  <FileUploaderContent>
                    {files &&
                      files.length > 0 &&
                      files.map((file, index: number) => (
                        <FileUploaderItem key={index} index={index}>
                          <Paperclip className="h-4 w-4 stroke-current" />
                          <span>{file.name}</span>
                        </FileUploaderItem>
                      ))}
                  </FileUploaderContent>
                </FileUploader>
              </div>
              <DialogFooter>
                <Button
                  variant="primary"
                  type="submit"
                  className="text-white w-full"
                >
                  Submit
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RequireAuthentication>
  );
};

export default AddOrEditList;
