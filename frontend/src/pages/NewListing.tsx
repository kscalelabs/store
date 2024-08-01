import { zodResolver } from "@hookform/resolvers/zod";
import RequireAuthentication from "components/auth/RequireAuthentication";
import TCButton from "components/files/TCButton";
import { RenderDescription } from "components/listing/ListingDescription";
import { Card, CardContent, CardHeader } from "components/ui/Card";
import ErrorMessage from "components/ui/ErrorMessage";
import Header from "components/ui/Header";
import { Input } from "components/ui/Input/Input";
import { useAlertQueue } from "hooks/alerts";
import { useAuthentication } from "hooks/auth";
import { useState } from "react";
import { Col } from "react-bootstrap";
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
      addAlert("Listing added successfully", "success");
      navigate(`/listing/${responseData.listing_id}`);
    }
  };

  return (
    <RequireAuthentication>
      <div className="flex justify-center">
        <Card className="w-[500px] shadow-md h-full mb-40">
          <CardHeader>
            <Header title="New Listing" />
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
                <textarea
                  placeholder="Description"
                  rows={4}
                  className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
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
              <Col md={12} className="mb-4">
                <TCButton type="submit">Submit</TCButton>
              </Col>
            </form>
          </CardContent>
        </Card>
      </div>
    </RequireAuthentication>
  );
};

export default NewListing;
