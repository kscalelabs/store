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
import { SellListingSchema, SellListingType } from "@/lib/types";
import ROUTES from "@/lib/types/routes";
import { slugify } from "@/lib/utils/formatString";
import { convertToCents, convertToDecimal } from "@/lib/utils/priceFormat";
import { zodResolver } from "@hookform/resolvers/zod";

import Container from "../ui/container";

const CreateSell = () => {
  const auth = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();
  const navigate = useNavigate();

  const [description, setDescription] = useState<string>("");
  const [images, setImages] = useState<ImageListType>([]);
  const [displayPrice, setDisplayPrice] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slug, setSlug] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [price_amount, setPriceAmount] = useState<number | null>(null);
  const [displayDepositAmount, setDisplayDepositAmount] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SellListingType>({
    resolver: zodResolver(SellListingSchema),
    defaultValues: {
      price_amount: 0,
      currency: "usd",
      inventory_type: "finite",
      inventory_quantity: null,
      preorder_release_date: null,
      preorder_deposit_amount: null,
    },
  });

  const inventoryType = watch("inventory_type");
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
      setPreviewUrl(
        `https://kscale.dev/bot/${auth.currentUser.username}/${slug}`,
      );
    }
  }, [auth.currentUser, slug]);

  const hasPermission = auth.currentUser?.permissions?.some(
    (permission) => permission === "is_admin" || permission === "is_mod",
  );

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/[^0-9]/g, "");
    if (!inputValue) {
      setPriceAmount(0);
      setDisplayPrice("");
      setValue("price_amount", null);
      return;
    }
    const decimalValue = convertToDecimal(inputValue);
    setPriceAmount(parseFloat(decimalValue));
    setDisplayPrice(decimalValue);
    setValue("price_amount", parseFloat(decimalValue));
  };

  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/[^0-9]/g, "");
    if (!inputValue) {
      setDisplayDepositAmount("");
      setValue("preorder_deposit_amount", null);
      return;
    }
    const decimalValue = convertToDecimal(inputValue);
    setDisplayDepositAmount(decimalValue);
    setValue("preorder_deposit_amount", parseFloat(decimalValue));
  };

  const handleImageChange = (imageList: ImageListType) => {
    setImages(imageList);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    if (date) {
      // Convert the date to Unix timestamp in seconds
      const timestamp = Math.floor(new Date(date).getTime() / 1000);
      setValue("preorder_release_date", timestamp);
    } else {
      setValue("preorder_release_date", null);
    }
  };

  const onSubmit = async (data: SellListingType) => {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description || "");
    formData.append("slug", slugify(data.name));

    if (data.price_amount) {
      formData.append(
        "price_amount",
        convertToCents(data.price_amount).toString(),
      );
    }

    formData.append("currency", "usd");
    formData.append("inventory_type", data.inventory_type);

    if (data.inventory_type === "finite" && data.inventory_quantity) {
      formData.append("inventory_quantity", data.inventory_quantity.toString());
    }

    if (data.inventory_type === "preorder" && data.preorder_release_date) {
      formData.append(
        "preorder_release_date",
        data.preorder_release_date.toString(),
      );
    }

    if (data.preorder_deposit_amount) {
      formData.append(
        "preorder_deposit_amount",
        convertToCents(data.preorder_deposit_amount).toString(),
      );
    }

    // Append photos
    images.forEach((image) => {
      if (image.file) {
        formData.append("photos", image.file);
      }
    });

    try {
      const { data: responseData, error } = await auth.client.POST(
        "/listings/add",
        // @ts-expect-error Server accepts FormData but TypeScript doesn't recognize it
        {
          body: formData,
        } as { body: FormData },
      );

      if (error) {
        addErrorAlert(`Failed to create listing: ${error.detail}`);
        return;
      }

      if (responseData && responseData.username && responseData.slug) {
        addAlert("New listing was created successfully", "success");
        navigate(
          ROUTES.BOT.buildPath({
            username: responseData.username,
            slug: responseData.slug,
          }),
        );
      }
    } catch (error) {
      console.error("Error creating listing:", error);
      addErrorAlert("Failed to create listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RequireAuthentication>
      <Container className="max-w-xl">
        <Card>
          <CardHeader>
            <Header title="List your robot" />
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 space-y-6"
            >
              {/* Name */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-1">
                  Name
                </label>
                <Input
                  placeholder="Name (at least 4 characters)"
                  type="text"
                  {...register("name")}
                />
                {errors?.name && (
                  <ErrorMessage>{errors.name.message}</ErrorMessage>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-1">
                  Description (supports Markdown formatting)
                </label>
                <TextArea
                  placeholder="Description (at least 6 characters)"
                  rows={4}
                  {...register("description", {
                    onChange: (e) => setDescription(e.target.value),
                  })}
                />
                {errors?.description && (
                  <ErrorMessage>{errors.description.message}</ErrorMessage>
                )}
              </div>

              {/* Description Preview */}
              {description && (
                <div>
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

              {/* Inventory Type */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-1">
                  Listing Type
                </label>
                <select
                  className="w-full p-2 rounded-md border border-gray-7 bg-gray-3 text-gray-12"
                  {...register("inventory_type")}
                >
                  <option value="finite">Limited Quantity</option>
                  {hasPermission && <option value="preorder">Pre-order</option>}
                </select>
              </div>

              {/* Quantity (for finite inventory) */}
              {inventoryType === "finite" && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-1">
                    Available Quantity
                  </label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Enter quantity"
                    {...register("inventory_quantity", { valueAsNumber: true })}
                  />
                  {errors?.inventory_quantity && (
                    <ErrorMessage>
                      {errors.inventory_quantity.message}
                    </ErrorMessage>
                  )}
                </div>
              )}

              {/* Price */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-1">
                  Price (USD)
                </label>
                <Input
                  placeholder="Enter price (e.g., 10.00)"
                  type="text"
                  value={displayPrice}
                  onChange={handlePriceChange}
                />
                {errors?.price_amount && (
                  <ErrorMessage>{errors.price_amount.message}</ErrorMessage>
                )}
                {price_amount && price_amount > 0 && (
                  <p className="mt-2 text-sm text-gray-6">
                    Price: ${displayPrice} USD
                  </p>
                )}
              </div>

              {/* Release Date (for pre-orders) */}
              {inventoryType === "preorder" && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-1">
                    Release Date
                  </label>
                  <Input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    onChange={handleDateChange}
                  />
                  {errors?.preorder_release_date && (
                    <ErrorMessage>
                      {errors.preorder_release_date.message}
                    </ErrorMessage>
                  )}
                </div>
              )}

              {/* Pre-order Deposit */}
              {price_amount &&
                price_amount > 0 &&
                inventoryType === "preorder" && (
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-1">
                      Pre-order Deposit Amount (USD)
                    </label>
                    <Input
                      placeholder="Enter deposit amount (e.g., 10.00)"
                      type="text"
                      value={displayDepositAmount}
                      onChange={handleDepositChange}
                    />
                    {errors?.preorder_deposit_amount && (
                      <ErrorMessage>
                        {errors?.preorder_deposit_amount?.message}
                      </ErrorMessage>
                    )}
                    {parseFloat(displayDepositAmount) > 0 && (
                      <div className="mt-2 space-y-1 text-sm text-gray-6">
                        <p>Deposit Amount: ${displayDepositAmount} USD</p>
                        <p>
                          Remaining Balance Due: $
                          {(
                            price_amount - parseFloat(displayDepositAmount)
                          ).toFixed(2)}{" "}
                          USD
                        </p>
                      </div>
                    )}
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
                  {isSubmitting ? "Listing..." : "List robot"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </Container>
    </RequireAuthentication>
  );
};

export default CreateSell;
