import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ImageListType } from "react-images-uploading";
import { useNavigate } from "react-router-dom";

import RequireAuthentication from "@/components/auth/RequireAuthentication";
import { RenderDescription } from "@/components/listing/ListingDescription";
import UploadContent from "@/components/listing/UploadContent";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Header from "@/components/ui/Header";
import { Input, TextArea } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/button";
import Container from "@/components/ui/container";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { ShareListingSchema, ShareListingType } from "@/lib/types";
import ROUTES from "@/lib/types/routes";
import { slugify } from "@/lib/utils/formatString";
import { zodResolver } from "@hookform/resolvers/zod";

const CreateShare = () => {
  const auth = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();
  const navigate = useNavigate();

  const [description, setDescription] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [images, setImages] = useState<ImageListType>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ShareListingType>({
    resolver: zodResolver(ShareListingSchema),
    mode: "onChange",
    criteriaMode: "all",
    shouldFocusError: true,
    shouldUseNativeValidation: false,
    reValidateMode: "onChange",
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
      setPreviewUrl(`/bot/${auth.currentUser.username}/${slug}`);
    }
  }, [auth.currentUser, slug]);

  const handleImageChange = (imageList: ImageListType) => {
    setImages(imageList);
  };

  const onSubmit = async ({ name, description, slug }: ShareListingType) => {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description || "");
    formData.append("slug", slug || slugify(name));

    // Append photos to formData
    images.forEach((image) => {
      if (image.file) {
        formData.append(`photos`, image.file);
      }
    });

    try {
      // @ts-expect-error Server accepts FormData but TypeScript doesn't recognize it
      const { data: responseData } = await auth.client.POST("/listings/add", {
        body: formData,
      } as { body: FormData });

      if (responseData && responseData.username && responseData.slug) {
        addAlert("New listing was created successfully", "success");
        navigate(
          ROUTES.BOT.buildPath({
            username: responseData.username,
            slug: responseData.slug,
          }),
        );
      } else {
        throw new Error("Invalid response data");
      }
    } catch (error) {
      addErrorAlert("Failed to create listing");
      console.error("Error creating listing:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RequireAuthentication>
      <Container className="max-w-xl">
        <Card>
          <CardHeader>
            <Header title="Share your robot" />
          </CardHeader>
          <CardContent className="p-6">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 space-y-6"
            >
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block mb-2 text-sm font-medium text-gray-1"
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
                  className="block mb-2 text-sm font-medium text-gray-1"
                >
                  Description (supports Markdown formatting)
                </label>
                <TextArea
                  id="description"
                  placeholder="Description (at least 6 characters)"
                  rows={4}
                  {...register("description", {
                    onChange: (e) => setDescription(e.target.value),
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
                  className="block mb-2 text-sm font-medium text-gray-300"
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
                  <label className="block mb-2 text-sm font-medium text-gray-1">
                    Listing URL Preview
                  </label>
                  <div className="p-2 bg-gray-5 rounded-md text-gray-12">
                    {previewUrl}
                  </div>
                </div>
              )}

              {/* Photos */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-1">
                  Photos
                </label>
                <UploadContent images={images} onChange={handleImageChange} />
              </div>

              {/* Submit */}
              <div className="flex justify-end">
                <Button variant="outline" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Posting..." : "Share Robot"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </Container>
    </RequireAuthentication>
  );
};

export default CreateShare;
