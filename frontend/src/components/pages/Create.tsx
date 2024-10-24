import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import RequireAuthentication from "@/components/auth/RequireAuthentication";
import { RenderDescription } from "@/components/listing/ListingDescription";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Header from "@/components/ui/Header";
import { Input, TextArea } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { NewListingSchema, NewListingType } from "@/lib/types";
import { slugify } from "@/lib/utils/formatString";
import { zodResolver } from "@hookform/resolvers/zod";

const Create = () => {
  const auth = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();
  const navigate = useNavigate();

  const [description, setDescription] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<NewListingType>({
    resolver: zodResolver(NewListingSchema),
  });

  const name = watch("name");

  useEffect(() => {
    if (name) {
      const newSlug = slugify(name);
      setSlug(newSlug);
      setValue("slug", newSlug, { shouldValidate: true });
    }
  }, [name, setValue]);

  useEffect(() => {
    if (auth.currentUser && slug) {
      setPreviewUrl(`/item/${auth.currentUser.username}/${slug}`);
    }
  }, [auth.currentUser, slug]);

  // On submit, add the listing to the database and navigate to the
  // newly-created listing.
  const onSubmit = async ({ name, description, slug }: NewListingType) => {
    const { data: responseData, error } = await auth.client.POST(
      "/listings/add",
      {
        body: {
          name,
          description,
          child_ids: [],
          slug,
        },
      },
    );

    if (error) {
      addErrorAlert(error);
    } else {
      addAlert("New listing was created successfully", "success");
      console.log(responseData);
      console.log(responseData.username);
      console.log(responseData.slug);
      navigate(`/item/${responseData.username}/${responseData.slug}`);
    }
  };

  return (
    <RequireAuthentication>
      <div className="container mx-auto max-w-lg shadow-md rounded-lg bg-gray-2 text-gray-12">
        <Card className="shadow-md">
          <CardHeader>
            <Header title="Post new build" />
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 space-y-6"
            >
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block mb-2 text-sm font-medium text-gray-12"
                >
                  Name
                </label>
                <Input
                  id="name"
                  placeholder="Name (at least 4 characters)"
                  type="text"
                  {...register("name")}
                />
                {errors?.name && (
                  <ErrorMessage>{errors?.name?.message}</ErrorMessage>
                )}
              </div>

              {/* Description Input */}
              <div className="relative">
                <label
                  htmlFor="description"
                  className="block mb-2 text-sm font-medium text-gray-12"
                >
                  Description (supports Markdown formatting)
                </label>
                <TextArea
                  id="description"
                  placeholder="Description (at least 6 characters)"
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
                  <h3 className="font-semibold mb-2">Description Preview</h3>
                  <RenderDescription description={description} />
                </div>
              )}

              {/* Slug */}
              <div>
                <label
                  htmlFor="slug"
                  className="block mb-2 text-sm font-medium text-gray-12"
                >
                  Slug
                </label>
                <Input
                  id="slug"
                  placeholder="Unique identifier for your listing"
                  type="text"
                  {...register("slug", {
                    onChange: (e) => {
                      const newSlug = slugify(e.target.value);
                      setSlug(newSlug);
                      setValue("slug", newSlug, { shouldValidate: true });
                    },
                  })}
                  value={slug}
                />
                {errors?.slug && (
                  <ErrorMessage>{errors?.slug?.message}</ErrorMessage>
                )}
              </div>

              {/* URL Preview */}
              {previewUrl && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-12">
                    Listing URL Preview
                  </label>
                  <div className="p-2 bg-gray-3 rounded-md text-gray-11">
                    {previewUrl}
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end">
                <Button variant="primary" type="submit">
                  Post build
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </RequireAuthentication>
  );
};

export default Create;
