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
import { Input, TextArea } from "components/ui/Input/Input";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { Paperclip } from "lucide-react";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { NewListingSchema, NewListingType } from "types";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "../ui/FileUpload";
interface AddOrEditProps {
  open: boolean;
  onClose: (open: boolean) => void;
}
const AddOrEditList = ({ open, onClose }: AddOrEditProps) => {
  const [files, setFiles] = useState<File[] | null>(null);
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

  const dropZoneConfig = {
    maxFiles: 5,
    maxSize: 1024 * 1024 * 4,
    multiple: true,
  };
  return (
    <RequireAuthentication>
      <div>
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent>
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
                      files.map((file: any, index: number) => (
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

const FileSvgDraw = () => {
  return (
    <>
      <svg
        className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 20 16"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
        />
      </svg>
      <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
        <span className="font-semibold">Click to upload</span>
        &nbsp; or drag and drop
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        SVG, PNG, JPG or GIF
      </p>
    </>
  );
};
