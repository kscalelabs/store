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

const CreateSell = () => {
  const auth = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();
  const navigate = useNavigate();

  const [description, setDescription] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [images, setImages] = useState<ImageListType>([]);
  const [displayPrice, setDisplayPrice] = useState<string>("0.00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventoryType, setInventoryType] = useState<
    "infinite" | "finite" | "preorder"
  >("infinite");
  const [isReservation, setIsReservation] = useState(false);
  const [displayDepositAmount, setDisplayDepositAmount] =
    useState<string>("0.00");

  useEffect(() => {
    if (!auth.currentUser?.stripe_connect_onboarding_completed) {
      navigate(`${ROUTES.BOTS.path}/${ROUTES.BOTS.$.CREATE.relativePath}`);
    }
  }, [auth.currentUser, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<SellListingType>({
    resolver: zodResolver(SellListingSchema),
    mode: "onChange",
    criteriaMode: "all",
    shouldFocusError: true,
    defaultValues: {
      price_amount: 0,
      currency: "usd",
      inventory_type: "infinite",
      inventory_quantity: null,
      preorder_release_date: null,
      is_reservation: false,
      reservation_deposit_amount: null,
    },
    shouldUseNativeValidation: false,
    reValidateMode: "onChange",
    context: {
      validate: (data: SellListingType) => {
        const {
          price_amount,
          currency,
          inventory_type,
          inventory_quantity,
          preorder_release_date,
          is_reservation,
          reservation_deposit_amount,
        } = data;
        if ((price_amount && !currency) || (!price_amount && currency)) {
          return {
            price_amount:
              "Price amount and currency must be provided together.",
            currency: "Price amount and currency must be provided together.",
          };
        }
        if (
          (inventory_type && !inventory_quantity) ||
          (!inventory_type && inventory_quantity)
        ) {
          return {
            inventory_type:
              "Inventory type and quantity must be provided together.",
            inventory_quantity:
              "Inventory type and quantity must be provided together.",
          };
        }
        if (
          (preorder_release_date && !is_reservation) ||
          (!preorder_release_date && is_reservation)
        ) {
          return {
            preorder_release_date:
              "Preorder release date and reservation must be provided together.",
            is_reservation:
              "Preorder release date and reservation must be provided together.",
          };
        }
        if (
          (is_reservation && !reservation_deposit_amount) ||
          (!is_reservation && reservation_deposit_amount)
        ) {
          return {
            reservation_deposit_amount:
              "Reservation deposit amount must be provided if reservation is true.",
            is_reservation:
              "Reservation deposit amount must be provided if reservation is true.",
          };
        }
        return {};
      },
    },
  });

  const name = watch("name");

  const price_amount = watch("price_amount");
  const currency = watch("currency");
  const inventory_quantity = watch("inventory_quantity");
  const preorder_release_date = watch("preorder_release_date");
  const reservation_deposit_amount = watch("reservation_deposit_amount");

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

  useEffect(() => {
    if ((price_amount && !currency) || (!price_amount && currency)) {
      trigger(["price_amount", "currency"]);
    }
  }, [price_amount, currency, trigger]);

  useEffect(() => {
    if (
      (inventory_quantity && !inventoryType) ||
      (!inventory_quantity && inventoryType)
    ) {
      trigger(["inventory_quantity", "inventory_type"]);
    }
  }, [inventory_quantity, inventoryType, trigger]);

  useEffect(() => {
    if (
      (preorder_release_date && !isReservation) ||
      (!preorder_release_date && isReservation)
    ) {
      trigger(["preorder_release_date", "is_reservation"]);
    }
  }, [preorder_release_date, isReservation, trigger]);

  useEffect(() => {
    if (
      (isReservation && !reservation_deposit_amount) ||
      (!isReservation && reservation_deposit_amount)
    ) {
      trigger(["reservation_deposit_amount", "is_reservation"]);
    }
  }, [reservation_deposit_amount, isReservation, trigger]);

  const handleImageChange = (imageList: ImageListType) => {
    setImages(imageList);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/[^0-9]/g, "");

    if (!inputValue) {
      setDisplayPrice("");
      setValue("price_amount", null, { shouldValidate: true });
      return;
    }

    const decimalValue = convertToDecimal(inputValue);
    setDisplayPrice(decimalValue);
    setValue("price_amount", parseFloat(decimalValue), {
      shouldValidate: true,
    });
  };

  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/[^0-9]/g, "");

    if (!inputValue) {
      setDisplayDepositAmount("");
      setValue("reservation_deposit_amount", null, { shouldValidate: true });
      return;
    }

    const decimalValue = convertToDecimal(inputValue);
    setDisplayDepositAmount(decimalValue);
    setValue("reservation_deposit_amount", parseFloat(decimalValue), {
      shouldValidate: true,
    });
  };

  const onSubmit = async ({
    name,
    description,
    slug,
    price_amount,
    currency,
    inventory_type,
    inventory_quantity,
    preorder_release_date,
    is_reservation,
    reservation_deposit_amount,
  }: SellListingType) => {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description || "");
    formData.append("slug", slug || slugify(name));
    formData.append(
      "price_amount",
      price_amount ? convertToCents(price_amount).toString() : "",
    );
    formData.append("currency", currency);
    formData.append("inventory_type", inventory_type);
    formData.append("inventory_quantity", inventory_quantity?.toString() || "");
    formData.append(
      "preorder_release_date",
      preorder_release_date?.toString() || "",
    );
    formData.append("is_reservation", is_reservation?.toString() || "");
    formData.append(
      "reservation_deposit_amount",
      reservation_deposit_amount
        ? convertToCents(reservation_deposit_amount).toString()
        : "",
    );

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

  const validateFields = () => {
    if ((price_amount && !currency) || (!price_amount && currency)) {
      return "Price amount and currency must be provided together or both left empty.";
    }
    if (
      (inventory_quantity && !inventoryType) ||
      (!inventory_quantity && inventoryType)
    ) {
      return "Inventory quantity and type must be provided together or both left empty.";
    }
    if (
      (preorder_release_date && !isReservation) ||
      (!preorder_release_date && isReservation)
    ) {
      return "Preorder release date and reservation must be provided together or both left empty.";
    }
    if (
      (isReservation && !reservation_deposit_amount) ||
      (!isReservation && reservation_deposit_amount)
    ) {
      return "Reservation deposit amount must be provided if reservation is true or both left empty.";
    }
    return true;
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
              onSubmit={handleSubmit((data) => {
                if (validateFields() !== true) {
                  addErrorAlert(
                    "Price amount and currency must be provided together or both left empty. Inventory quantity and type must be provided together or both left empty. Preorder release date and reservation must be provided together or both left empty. Reservation deposit amount must be provided if reservation is true or both left empty.",
                  );
                  return;
                }
                onSubmit(data);
              })}
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

              {/* Payment Section */}
              <div className="space-y-4 border-t border-gray-6 pt-4">
                <h3 className="font-semibold">Payment Settings</h3>

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
                  {errors?.price_amount && (
                    <ErrorMessage>{errors?.price_amount?.message}</ErrorMessage>
                  )}
                  {displayPrice && (
                    <p className="mt-1 text-sm text-gray-11">
                      Entered price: ${displayPrice}
                    </p>
                  )}
                </div>

                {/* Inventory Type */}
                {price_amount && price_amount > 0 && (
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-12">
                      Inventory Type
                    </label>
                    <select
                      className="w-full p-2 rounded-md border border-gray-7 bg-gray-3"
                      {...register("inventory_type")}
                      onChange={(e) => {
                        setInventoryType(
                          e.target.value as typeof inventoryType,
                        );
                        setValue(
                          "inventory_type",
                          e.target.value as typeof inventoryType,
                        );
                      }}
                    >
                      <option value="infinite">Unlimited</option>
                      <option value="finite">Limited Quantity</option>
                      <option value="preorder">Pre-order</option>
                    </select>
                  </div>
                )}

                {/* Finite Inventory Quantity */}
                {inventoryType === "finite" && (
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-12">
                      Available Quantity
                    </label>
                    <Input
                      type="number"
                      min="1"
                      {...register("inventory_quantity", {
                        valueAsNumber: true,
                        validate: (value) =>
                          (value && value > 0) ||
                          "Quantity must be greater than 0",
                      })}
                    />
                    {errors?.inventory_quantity && (
                      <ErrorMessage>
                        {errors?.inventory_quantity?.message}
                      </ErrorMessage>
                    )}
                  </div>
                )}

                {/* Pre-order Release Date */}
                {inventoryType === "preorder" && (
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-12">
                      Release Date
                    </label>
                    <Input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      {...register("preorder_release_date", {
                        setValueAs: (value) =>
                          value ? new Date(value).getTime() / 1000 : null,
                      })}
                    />
                    {errors?.preorder_release_date && (
                      <ErrorMessage>
                        {errors?.preorder_release_date?.message}
                      </ErrorMessage>
                    )}
                  </div>
                )}

                {/* Reservation Option */}
                {price_amount &&
                  price_amount > 0 &&
                  inventoryType !== "preorder" && (
                    <div className="space-y-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...register("is_reservation")}
                          onChange={(e) => {
                            setIsReservation(e.target.checked);
                            setValue("is_reservation", e.target.checked);
                          }}
                          className="rounded border-gray-7"
                        />
                        <span className="text-sm font-medium text-gray-12">
                          Enable Reservation
                        </span>
                      </label>

                      {isReservation && (
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-12">
                            Reservation Deposit Amount
                          </label>
                          <Input
                            placeholder="Enter deposit amount"
                            type="text"
                            value={displayDepositAmount}
                            onChange={handleDepositChange}
                          />
                          {errors?.reservation_deposit_amount && (
                            <ErrorMessage>
                              {errors?.reservation_deposit_amount?.message}
                            </ErrorMessage>
                          )}
                          {displayDepositAmount && (
                            <p className="mt-1 text-sm text-gray-11">
                              Deposit amount: ${displayDepositAmount}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
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

export default CreateSell;
