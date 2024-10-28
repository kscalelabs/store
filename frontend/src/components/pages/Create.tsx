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
  const [images, setImages] = useState<ImageListType>([]);
  const [displayPrice, setDisplayPrice] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleImageChange = (imageList: ImageListType) => {
    setImages(imageList);
  };

  const convertToDecimal = (value: string) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return "";
    return (numericValue / 100).toFixed(2);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/[^0-9]/g, "");
    const decimalValue = convertToDecimal(inputValue);
    setDisplayPrice(decimalValue);
    setValue("price", parseFloat(decimalValue), { shouldValidate: true });
  };

  const onSubmit = async ({
    name,
    description,
    slug,
    stripe_link,
    price,
  }: NewListingType) => {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description || "");
    formData.append("slug", slug || slugify(name));
    formData.append("stripe_link", stripe_link || "");
    if (price !== undefined && price !== null) {
      const priceInCents = Math.round(price * 100);
      formData.append("price", priceInCents.toString());
    }

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
        navigate(`/item/${responseData.username}/${responseData.slug}`);
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

              {/* Stripe Link */}
              <div>
                <label
                  htmlFor="stripe_link"
                  className="block mb-2 text-sm font-medium text-gray-12"
                >
                  Stripe Link
                </label>
                <Input
                  id="stripe_link"
                  placeholder="Enter your Stripe product link"
                  type="text"
                  {...register("stripe_link")}
                />
                {errors?.stripe_link && (
                  <ErrorMessage>{errors?.stripe_link?.message}</ErrorMessage>
                )}
              </div>

              {/* Price */}
              <div>
                <label
                  htmlFor="price"
                  className="block mb-2 text-sm font-medium text-gray-12"
                >
                  Price
                </label>
                <Input
                  id="price"
                  placeholder="Enter price (e.g., 10.00)"
                  type="text"
                  value={displayPrice}
                  onChange={handlePriceChange}
                />
                {errors?.price && (
                  <ErrorMessage>{errors?.price?.message}</ErrorMessage>
                )}
                {displayPrice && (
                  <p className="mt-1 text-sm text-gray-11">
                    Entered price: ${displayPrice}
                  </p>
                )}
              </div>

              {/* Photos */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-12">
                  Photos
                </label>
                <UploadContent images={images} onChange={handleImageChange} />
              </div>

              {/* Submit */}
              <div className="flex justify-end">
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Posting..." : "Post build"}
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
