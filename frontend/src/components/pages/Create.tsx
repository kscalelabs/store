import { useState, useEffect } from "react";
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
import UploadContent from "@/components/listing/UploadContent";
import { ImageListType } from "react-images-uploading";

const Create = () => {
  const auth = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();
  const navigate = useNavigate();

  const [description, setDescription] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [images, setImages] = useState<ImageListType>([]);
  const [keyFeatures, setKeyFeatures] = useState<string>("");
  const [displayPrice, setDisplayPrice] = useState<string>("");

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

  const onSubmit = async ({ name, description, slug, stripeLink, keyFeatures, price }: NewListingType) => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description || "");
    formData.append("slug", slug || slugify(name));
    formData.append("stripe_link", stripeLink || "");
    formData.append("key_features", keyFeatures || "");
    if (price !== undefined && price !== null) {
      const priceInCents = Math.round(price * 100);
      formData.append("price", priceInCents.toString());
    }

    // Append photos to formData
    images.forEach((image, index) => {
      if (image.file) {
        formData.append(`photos`, image.file);
      }
    });

    try {
      const { data: responseData, error } = await auth.client.POST(
        "/listings/add",
        {
          body: formData,
        },
      );

      if (error) {
        addErrorAlert(error);
      } else {
        addAlert("New listing was created successfully", "success");
        navigate(`/item/${responseData.username}/${responseData.slug}`);
      }
    } catch (error) {
      addErrorAlert("Failed to create listing");
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
                <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-12">
                  Name
                </label>
                <Input
                  id="name"
                  placeholder="Name (at least 4 characters)"
                  type="text"
                  {...register("name")}
                />
                {errors?.name && <ErrorMessage>{errors?.name?.message}</ErrorMessage>}
              </div>

              {/* Description Input */}
              <div className="relative">
                <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-12">
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
                {errors?.description && <ErrorMessage>{errors?.description?.message}</ErrorMessage>}
              </div>

              {/* Render Description */}
              {description && (
                <div className="relative">
                  <h3 className="font-semibold mb-2">Description Preview</h3>
                  <RenderDescription description={description} />
                </div>
              )}

              {/* Key Features */}
              <div className="relative">
                <label htmlFor="keyFeatures" className="block mb-2 text-sm font-medium text-gray-12">
                  Key Features (supports Markdown formatting)
                </label>
                <TextArea
                  id="keyFeatures"
                  placeholder="Enter key features (supports Markdown)"
                  rows={4}
                  {...register("keyFeatures", {
                    onChange: (e) => setKeyFeatures(e.target.value),
                  })}
                />
                {errors?.keyFeatures && <ErrorMessage>{errors?.keyFeatures?.message}</ErrorMessage>}
              </div>

              {/* Render Key Features */}
              {keyFeatures && (
                <div className="relative">
                  <h3 className="font-semibold mb-2">Key Features Preview</h3>
                  <RenderDescription description={keyFeatures} />
                </div>
              )}

              {/* Slug */}
              <div>
                <label htmlFor="slug" className="block mb-2 text-sm font-medium text-gray-12">
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
                {errors?.slug && <ErrorMessage>{errors?.slug?.message}</ErrorMessage>}
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
                <label htmlFor="stripeLink" className="block mb-2 text-sm font-medium text-gray-12">
                  Stripe Link
                </label>
                <Input
                  id="stripeLink"
                  placeholder="Enter your Stripe product link"
                  type="text"
                  {...register("stripeLink")}
                />
                {errors?.stripeLink && <ErrorMessage>{errors?.stripeLink?.message}</ErrorMessage>}
              </div>

              {/* Price */}
              <div>
                <label htmlFor="price" className="block mb-2 text-sm font-medium text-gray-12">
                  Price
                </label>
                <Input
                  id="price"
                  placeholder="Enter price (e.g., 10.00)"
                  type="text"
                  value={displayPrice}
                  onChange={handlePriceChange}
                />
                {errors?.price && <ErrorMessage>{errors?.price?.message}</ErrorMessage>}
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
