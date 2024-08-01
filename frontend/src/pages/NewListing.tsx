import { zodResolver } from "@hookform/resolvers/zod";
import RequireAuthentication from "components/auth/RequireAuthentication";
import { RenderDescription } from "components/listing/ListingDescription";
import { Button } from "components/ui/Button/Button";
import { Card, CardContent, CardHeader } from "components/ui/Card";
import ErrorMessage from "components/ui/ErrorMessage";
import Header from "components/ui/Header";
import { Input, TextArea } from "components/ui/Input/Input";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { NewListingSchema, NewListingType } from "types";

const NewListing = () => {
  const auth = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();
  const navigate = useNavigate();

  const [description, setDescription] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewListingType>({
    resolver: zodResolver(NewListingSchema),
  });

  // On submit, add the listing to the database and navigate to the
  // newly-created listing.
  const onSubmit = async ({ name, description }: NewListingType) => {
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
      addAlert("New listing was created successfully", "success");
      navigate(`/listing/${responseData.listing_id}`);
    }
  };

  return (
    <RequireAuthentication>
      <div className="flex justify-center">
        <Card className="w-[500px] shadow-md h-full mb-40">
          <CardHeader>
            <Header title="Create" />
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 space-y-6"
            >
              {/* Name */}
              <div>
                <Input placeholder="Name" type="text" {...register("name")} />
                {errors?.name && (
                  <ErrorMessage>{errors?.name?.message}</ErrorMessage>
                )}
              </div>

              {/* Description Input */}
              <div className="relative">
                <TextArea
                  placeholder="Description"
                  rows={4}
                  {...register("description", {
                    setValueAs: (value) => {
                      setDescription(value);
                      return value;
                    },
                  })}
                />
                {errors?.description && (
                  <ErrorMessage>{errors?.description?.message}</ErrorMessage>
                )}
              </div>

              {/* Render Description */}
              {description && (
                <div className="relative">
                  <RenderDescription description={description} />
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end">
                <Button variant="primary" type="submit">
                  Submit
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </RequireAuthentication>
  );
};

export default NewListing;
