import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FaCheck, FaEye, FaPen, FaStar, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import Container from "@/components/Container";
import ListingDeleteButton from "@/components/listing/ListingDeleteButton";
import { RenderDescription } from "@/components/listing/ListingDescription";
import ListingVoteButtons from "@/components/listing/ListingVoteButtons";
import ProductPageSkeleton from "@/components/products/ProductPageSkeleton";
import CheckoutButton from "@/components/stripe/CheckoutButton";
import { Input, TextArea } from "@/components/ui/Input/Input";
import Spinner from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import { humanReadableError, useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils/formatNumber";
import { formatNumber } from "@/lib/utils/formatNumber";
import { formatTimeSince } from "@/lib/utils/formatTimeSince";
import { convertToDecimal } from "@/lib/utils/priceFormat";

const FALLBACK_IMAGE =
  "https://flowbite.com/docs/images/examples/image-1@2x.jpg";

interface ProductPageProps {
  productId: string;
  checkoutLabel: string;
  title: string;
  description: string;
  features?: string[];
  price: number;
  images: string[];
  creatorName?: string;
  creatorId?: string;
  onPriceChange?: (newPrice: number) => void;
  onImagesChange?: (newImages: string[]) => void;
}

const ProductPage: React.FC<ProductPageProps> = ({
  productId,
  checkoutLabel,
  title,
  description: initialDescription,
  features = [],
  price,
  images = [],
  onPriceChange,
  onImagesChange,
}) => {
  const navigate = useNavigate();
  const auth = useAuthentication();
  const { addErrorAlert, addAlert } = useAlertQueue();
  const [creatorInfo, setCreatorInfo] = useState<{
    name: string | null;
    id: string;
    views: number;
    created_at: number;
    slug: string | null;
    can_edit: boolean;
    score: number;
    user_vote: number | null;
    stripe_link: string | null;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCreatorInfo = async () => {
      setIsLoading(true);
      const { data, error } = await auth.client.GET("/listings/{id}", {
        params: {
          path: { id: productId },
        },
      });

      if (!error && data) {
        setCreatorInfo({
          name: data.creator_name,
          id: data.creator_id,
          views: data.views,
          created_at: data.created_at,
          slug: data.slug,
          can_edit: data.can_edit,
          score: data.score,
          user_vote: data.user_vote as number | null,
          stripe_link: data.stripe_link,
        });
      }
      setIsLoading(false);
    };

    fetchCreatorInfo();
  }, [productId, auth.client]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  const [isTransitioning, setIsTransitioning] = useState(false);

  const prevImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setFadeOut(true);

    setTimeout(() => {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex - 1 + images.length) % images.length,
      );
      setFadeOut(false);
      setIsTransitioning(false);
    }, 300);
  };

  const nextImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setFadeOut(true);

    setTimeout(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
      setFadeOut(false);
      setIsTransitioning(false);
    }, 300);
  };

  const [isFixed, setIsFixed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { bottom } = contentRef.current.getBoundingClientRect();
        setIsFixed(bottom > window.innerHeight);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState("");

  const openModal = (image: string) => {
    setModalImage(image);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const [currentImages, setCurrentImages] = useState<string[]>(images);

  useEffect(() => {
    setCurrentImages(images);
  }, [images]);

  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [deletingImageIndex, setDeletingImageIndex] = useState<number | null>(
    null,
  );

  const handleDeleteImage = async (imageUrl: string, index: number) => {
    if (!creatorInfo?.can_edit) {
      addErrorAlert("You don't have permission to delete this image");
      return;
    }

    setDeletingImageIndex(index);

    try {
      const artifactId = imageUrl.match(
        /\/artifacts\/media\/([^/]+)\/([^/]+)/,
      )?.[2];

      if (!artifactId) {
        addErrorAlert("Invalid image URL format");
        setDeletingImageIndex(null);
        return;
      }

      const { error } = await auth.client.DELETE(
        "/artifacts/delete/{artifact_id}",
        {
          params: {
            path: { artifact_id: artifactId },
          },
        },
      );

      if (error) {
        addErrorAlert(error);
        setDeletingImageIndex(null);
      } else {
        const newImages = currentImages.filter((img) => img !== imageUrl);
        setCurrentImages(newImages);
        if (onImagesChange) {
          onImagesChange(newImages);
        }
        setDeletingImageIndex(null);
        addAlert("Image deleted successfully", "success");
        if (currentImageIndex >= newImages.length - 1) {
          setCurrentImageIndex(Math.max(0, newImages.length - 2));
        }
      }
    } catch (err) {
      addErrorAlert(humanReadableError(err));
      setDeletingImageIndex(null);
    }
  };

  useEffect(() => {
    if (auth.currentUser && newSlug) {
      setPreviewUrl(`/item/${auth.currentUser.username}/${newSlug}`);
    }
  }, [auth.currentUser, newSlug]);

  useEffect(() => {
    if (creatorInfo?.slug) {
      setNewSlug(creatorInfo.slug);
    }
  }, [creatorInfo]);

  const handleSaveSlug = async () => {
    if (newSlug === creatorInfo?.slug) {
      setIsEditingSlug(false);
      return;
    }

    const { error } = await auth.client.PUT(`/listings/edit/{id}/slug`, {
      params: { path: { id: productId }, query: { new_slug: newSlug } },
    });

    if (error) {
      addErrorAlert(error);
    } else {
      addAlert("Listing URL updated successfully", "success");
      setIsEditingSlug(false);
      if (newSlug !== "") {
        navigate(`/item/${auth.currentUser?.username}/${newSlug}`);
      }
    }
  };

  const sanitizeSlug = (input: string) => {
    return input
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const [hasChanged, setHasChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSaveTitle = async () => {
    if (!hasChanged) {
      setIsEditingTitle(false);
      return;
    }
    if (newTitle.length < 4) {
      addErrorAlert("Title must be at least 4 characters long.");
      return;
    }
    setSubmitting(true);
    const { error } = await auth.client.PUT("/listings/edit/{id}", {
      params: {
        path: { id: productId },
      },
      body: {
        name: newTitle,
      },
    });
    if (error) {
      addErrorAlert(error);
    } else {
      addAlert("Listing updated successfully", "success");
      setIsEditingTitle(false);
    }
    setSubmitting(false);
  };

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [newDescription, setNewDescription] = useState(initialDescription);
  const [descriptionHasChanged, setDescriptionHasChanged] = useState(false);

  const handleSaveDescription = async () => {
    if (!descriptionHasChanged) {
      setIsEditingDescription(false);
      return;
    }
    if (newDescription.length < 6) {
      addErrorAlert("Description must be at least 6 characters long.");
      return;
    }
    setSubmitting(true);
    const { error } = await auth.client.PUT("/listings/edit/{id}", {
      params: {
        path: { id: productId },
      },
      body: {
        description: newDescription,
      },
    });
    if (error) {
      addErrorAlert(error);
    } else {
      addAlert("Listing updated successfully", "success");
      setIsEditingDescription(false);
    }
    setSubmitting(false);
  };

  const displayImages =
    currentImages.length > 0 ? currentImages : [FALLBACK_IMAGE];
  const showNavigation = displayImages.length > 1;

  const shouldShowCheckout = price > 0 && checkoutLabel;

  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [displayPrice, setDisplayPrice] = useState<string>("");
  const [newPrice, setNewPrice] = useState(price);
  const [priceHasChanged, setPriceHasChanged] = useState(false);

  const [currentPrice, setCurrentPrice] = useState(price);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/[^0-9]/g, "");
    const decimalValue = convertToDecimal(inputValue);
    setDisplayPrice(decimalValue);
    const numericPrice = parseInt(inputValue, 10);
    setNewPrice(numericPrice);
    setPriceHasChanged(true);
  };

  const handleSavePrice = async () => {
    if (!priceHasChanged) {
      setIsEditingPrice(false);
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await auth.client.PUT("/listings/edit/{id}", {
        params: {
          path: { id: productId },
        },
        body: {
          price: Number(newPrice),
        },
      });

      if (error) {
        addErrorAlert(error);
      } else {
        setCurrentPrice(newPrice);
        if (onPriceChange) {
          onPriceChange(newPrice);
        }
        addAlert("Price updated successfully", "success");
        setIsEditingPrice(false);
      }
    } catch (err) {
      addErrorAlert(humanReadableError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetMainImage = async (imageUrl: string, index: number) => {
    if (!creatorInfo?.can_edit) {
      addErrorAlert("You don't have permission to modify this listing");
      return;
    }

    try {
      const artifactId = imageUrl.match(
        /\/artifacts\/media\/([^/]+)\/([^/]+)/,
      )?.[2];

      if (!artifactId) {
        addErrorAlert("Invalid image URL format");
        return;
      }

      const { error } = await auth.client.PUT(
        "/artifacts/list/{listing_id}/main_image",
        {
          params: {
            path: { listing_id: productId },
            query: { artifact_id: artifactId },
          },
        },
      );

      if (error) {
        addErrorAlert(error);
      } else {
        const newImages = [...currentImages];
        newImages.splice(index, 1);
        newImages.unshift(imageUrl);
        setCurrentImages(newImages);
        setCurrentImageIndex(0);
        if (onImagesChange) {
          onImagesChange(newImages);
        }
        addAlert("Main image updated successfully", "success");
      }
    } catch (err) {
      addErrorAlert(humanReadableError(err));
    }
  };

  const [isEditingStripeLink, setIsEditingStripeLink] = useState(false);
  const [newStripeLink, setNewStripeLink] = useState("");
  const [stripeLinkHasChanged, setStripeLinkHasChanged] = useState(false);

  useEffect(() => {
    if (creatorInfo?.stripe_link) {
      setNewStripeLink(creatorInfo.stripe_link);
    }
  }, [creatorInfo]);

  const handleSaveStripeLink = async () => {
    if (!stripeLinkHasChanged) {
      setIsEditingStripeLink(false);
      return;
    }

    setSubmitting(true);
    const { error } = await auth.client.PUT("/listings/edit/{id}", {
      params: {
        path: { id: productId },
      },
      body: {
        stripe_link: newStripeLink,
      },
    });

    if (error) {
      addErrorAlert(error);
    } else {
      addAlert("Stripe link updated successfully", "success");
      setIsEditingStripeLink(false);
    }
    setSubmitting(false);
  };

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (files: File[]) => {
    if (!creatorInfo?.can_edit) {
      addErrorAlert("You don't have permission to upload images");
      return;
    }

    setIsUploadingImage(true);

    try {
      const { data, error } = await auth.api.upload(files, productId);

      if (error) {
        const errorMessage =
          typeof error === "object" && error.detail
            ? error.detail[0]?.msg || JSON.stringify(error)
            : String(error);
        addErrorAlert(errorMessage);
      } else if (data?.artifacts?.[0]?.urls?.large) {
        const newImage = data.artifacts[0].urls.large;
        const newImages = [...currentImages, newImage];
        setCurrentImages(newImages);
        if (onImagesChange) {
          onImagesChange(newImages);
        }
        addAlert("Image uploaded successfully", "success");
      } else {
        console.error("Unexpected response format:", data);
        addErrorAlert("Failed to process server response");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while uploading the image";
      addErrorAlert(errorMessage);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    multiple: false,
    onDrop: handleImageUpload,
  });

  return (
    <Container>
      {isLoading ? (
        <ProductPageSkeleton />
      ) : (
        <div ref={contentRef}>
          <div className="flex flex-col lg:flex-row items-start justify-between max-w-7xl mx-auto py-12 gap-12 mb-24">
            <div className="w-full lg:w-1/2 relative flex gap-4">
              {/* Voting buttons */}
              <div className="flex flex-col items-center">
                <ListingVoteButtons
                  listingId={productId}
                  initialScore={creatorInfo?.score ?? 0}
                  initialUserVote={creatorInfo?.user_vote ? true : null}
                />
              </div>

              {/* Image section - Update this container */}
              <div className="flex-1 relative">
                <div className="aspect-square relative">
                  <img
                    src={displayImages[currentImageIndex]}
                    alt={`${title} - Image ${currentImageIndex + 1}`}
                    className={`absolute inset-0 w-full h-full rounded-lg shadow-lg object-cover transition-opacity duration-300 ${
                      fadeOut ? "opacity-0" : "opacity-100"
                    } cursor-pointer`}
                    onClick={() => openModal(displayImages[currentImageIndex])}
                  />
                  {showNavigation && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 p-2 rounded-full border-gray-800 hover:bg-opacity-75 transition-all duration-300"
                      >
                        <span className="sr-only">Previous image</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 p-2 rounded-full border-gray-800 hover:bg-opacity-75 transition-all duration-300"
                      >
                        <span className="sr-only">Next image</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-1/2">
              <div className="py-4 md:py-8">
                <div className="flex items-center">
                  {submitting ? (
                    <Spinner />
                  ) : (
                    <>
                      {isEditingTitle ? (
                        <Input
                          type="text"
                          value={newTitle}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveTitle();
                            }
                          }}
                          onChange={(e) => {
                            setNewTitle(e.target.value);
                            setHasChanged(true);
                          }}
                          className="border-b border-gray-5"
                          autoFocus
                        />
                      ) : (
                        <h3 className="text-xl/normal md:text-2xl/normal font-medium text-black pr-2">
                          {newTitle}
                        </h3>
                      )}
                      {creatorInfo?.can_edit && (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => {
                              if (isEditingTitle) {
                                handleSaveTitle();
                              } else {
                                setIsEditingTitle(true);
                              }
                            }}
                            variant="ghost"
                            className="-ml-3"
                          >
                            {isEditingTitle ? <FaCheck /> : <FaPen />}
                          </Button>
                          <ListingDeleteButton listingId={productId} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex w-full">
                <div className="h-[1px] bg-neutral-200 w-full"></div>
                <div className="h-[1px] bg-gradient-to-r from-neutral-200 to-transparent w-full"></div>
              </div>

              <div className="py-4 md:py-8">
                {creatorInfo && (
                  <>
                    <p className="font-medium leading-[22px]">
                      Listed by{" "}
                      <span
                        onClick={() => navigate(`/profile/${creatorInfo.id}`)}
                        className="text-primary hover:underline hover:text-primary/80 cursor-pointer"
                      >
                        {creatorInfo.name}
                      </span>
                      {creatorInfo.can_edit && (
                        <>
                          {isEditingSlug ? (
                            <div className="flex flex-col space-y-2 mt-2">
                              <Input
                                type="text"
                                value={newSlug}
                                onChange={(e) =>
                                  setNewSlug(sanitizeSlug(e.target.value))
                                }
                                className="border-b border-gray-5"
                                placeholder="Enter new URL slug"
                              />
                              {previewUrl && (
                                <div className="text-sm text-gray-11 font-medium">
                                  Preview: {previewUrl}
                                </div>
                              )}
                              <div className="flex space-x-2">
                                <Button
                                  onClick={handleSaveSlug}
                                  variant="primary"
                                  size="sm"
                                >
                                  Save
                                </Button>
                                <Button
                                  onClick={() => setIsEditingSlug(false)}
                                  variant="ghost"
                                  size="sm"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              onClick={() => setIsEditingSlug(true)}
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-primary/80 -my-1 h-auto py-0 px-2"
                            >
                              <FaPen className="mr-2" /> Edit URL
                            </Button>
                          )}
                        </>
                      )}
                    </p>
                    <div className="mt-2 text-sm text-muted-foreground flex items-center gap-4 flex-wrap">
                      <div className="flex items-center">
                        <FaEye className="mr-1" />
                        <span>{formatNumber(creatorInfo.views)} views</span>
                      </div>
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center gap-2">
                          Posted{" "}
                          {formatTimeSince(
                            new Date(creatorInfo.created_at * 1000),
                          )}
                          {creatorInfo.can_edit && (
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => {
                                  setIsEditingPrice(true);
                                  setDisplayPrice(
                                    convertToDecimal(price.toString()),
                                  );
                                  setNewPrice(price);
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary/80 -my-1 h-auto py-0 px-2"
                              >
                                <FaPen className="mr-2" /> Edit Price
                              </Button>
                              <Button
                                onClick={() =>
                                  setIsEditingStripeLink(!isEditingStripeLink)
                                }
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary/80 -my-1 h-auto py-0 px-2"
                              >
                                <FaPen className="mr-2" /> Edit Stripe Link
                              </Button>
                            </div>
                          )}
                        </div>

                        {isEditingPrice && (
                          <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                            <div className="flex flex-col gap-2">
                              <label className="text-sm font-medium">
                                Edit Price
                              </label>
                              <Input
                                type="text"
                                value={displayPrice}
                                onChange={handlePriceChange}
                                className="border-gray-200"
                                placeholder="Enter price (e.g., 10.00)"
                              />
                              {displayPrice && (
                                <p className="mt-1 text-sm text-gray-11">
                                  Entered price: ${displayPrice}
                                </p>
                              )}
                              <div className="flex gap-2">
                                <Button
                                  onClick={handleSavePrice}
                                  variant="primary"
                                  size="sm"
                                  disabled={!priceHasChanged || submitting}
                                >
                                  {submitting ? (
                                    <Spinner className="h-4 w-4" />
                                  ) : (
                                    "Save"
                                  )}
                                </Button>
                                <Button
                                  onClick={() => {
                                    setIsEditingPrice(false);
                                    setNewPrice(price);
                                    setDisplayPrice("");
                                    setPriceHasChanged(false);
                                  }}
                                  variant="ghost"
                                  size="sm"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {isEditingStripeLink && (
                          <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                            <div className="flex flex-col gap-2">
                              <label className="text-sm font-medium">
                                Edit Stripe Product Link
                              </label>
                              <Input
                                type="text"
                                value={newStripeLink}
                                onChange={(e) => {
                                  setNewStripeLink(e.target.value);
                                  setStripeLinkHasChanged(true);
                                }}
                                className="border-gray-200"
                                placeholder="Enter Stripe product link"
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={handleSaveStripeLink}
                                  variant="primary"
                                  size="sm"
                                  disabled={!stripeLinkHasChanged || submitting}
                                >
                                  {submitting ? (
                                    <Spinner className="h-4 w-4" />
                                  ) : (
                                    "Save"
                                  )}
                                </Button>
                                <Button
                                  onClick={() => {
                                    setIsEditingStripeLink(false);
                                    setStripeLinkHasChanged(false);
                                  }}
                                  variant="ghost"
                                  size="sm"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex w-full">
                <div className="h-[1px] bg-neutral-200 w-full"></div>
                <div className="h-[1px] bg-gradient-to-r from-neutral-200 to-transparent w-full"></div>
              </div>

              <div className="py-8">
                <div className="space-y-4">
                  <div className="text-black leading-6">
                    {submitting ? (
                      <Spinner />
                    ) : (
                      <>
                        {isEditingDescription ? (
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-4">
                              <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">
                                  Edit Description (Markdown supported)
                                </label>
                                <TextArea
                                  value={newDescription}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && e.ctrlKey) {
                                      handleSaveDescription();
                                    }
                                  }}
                                  onChange={(e) => {
                                    setNewDescription(e.target.value);
                                    setDescriptionHasChanged(true);
                                  }}
                                  className="min-h-[300px] font-mono text-sm p-4"
                                  placeholder="# Heading 1
                                    ## Heading 2
                                    **Bold text**
                                    *Italic text*

                                    - Bullet point
                                    - Another point

                                    1. Numbered list
                                    2. Second item

                                    [Link text](https://example.com)

                                    ![Image alt text](image-url.jpg)"
                                  autoFocus
                                />
                              </div>
                              <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">
                                  Preview
                                </label>
                                <div className="border rounded-md p-4 min-h-[200px] bg-gray-50">
                                  <RenderDescription
                                    description={newDescription}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleSaveDescription}
                                variant="primary"
                                size="sm"
                                disabled={!descriptionHasChanged}
                              >
                                Save
                              </Button>
                              <Button
                                onClick={() => {
                                  setIsEditingDescription(false);
                                  setNewDescription(initialDescription);
                                  setDescriptionHasChanged(false);
                                }}
                                variant="ghost"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <RenderDescription description={newDescription} />
                            {creatorInfo?.can_edit && (
                              <Button
                                onClick={() => setIsEditingDescription(true)}
                                variant="ghost"
                                className="-mr-3"
                              >
                                <FaPen />
                              </Button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {features.length > 0 && (
                    <ul className="list-disc list-inside text-gray-700">
                      {features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          {currentImages.length > 0 && (
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {creatorInfo?.can_edit && (
                  <div
                    {...getRootProps()}
                    className={`aspect-square overflow-hidden rounded-lg shadow-md cursor-pointer relative group border-2 border-dashed ${
                      isDragActive ? "border-primary" : "border-gray-300"
                    } flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors`}
                  >
                    <input {...getInputProps()} />
                    <div className="text-center p-4">
                      {isUploadingImage ? (
                        <Spinner className="h-8 w-8 mx-auto" />
                      ) : (
                        <>
                          <div className="text-4xl mb-2">+</div>
                          <p className="text-sm text-gray-600">
                            {isDragActive ? "Drop image here" : "Upload Image"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {currentImages.map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square overflow-hidden rounded-lg shadow-md cursor-pointer relative group"
                    onClick={() => openModal(image)}
                  >
                    <img
                      src={image}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    {creatorInfo?.can_edit && (
                      <div className="absolute top-2 right-2 flex gap-2">
                        {index !== 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetMainImage(image, index);
                            }}
                            className="text-gray-500 hover:text-yellow-500 bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            aria-label="Set as main image"
                            title="Set as main image"
                          >
                            <FaStar className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(image, index);
                          }}
                          disabled={deletingImageIndex === index}
                          className="text-gray-500 hover:text-red-500 bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          aria-label="Delete image"
                        >
                          {deletingImageIndex === index ? (
                            <Spinner className="h-4 w-4" />
                          ) : (
                            <FaTrash className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )}
                    {index === 0 && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-white/75 text-xs font-medium px-2 py-1 rounded-full">
                          Main Image
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {shouldShowCheckout && isFixed && (
            <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md p-4 transition-all duration-300 ease-in-out z-10">
              <div className="max-w-7xl mx-auto flex justify-between items-center px-6">
                <p className="text-2xl font-semibold">
                  {formatPrice(currentPrice)}
                </p>
                <CheckoutButton productId={productId} label={checkoutLabel} />
              </div>
            </div>
          )}

          {shouldShowCheckout && (
            <div className="relative left-0 right-0 bg-white shadow-md p-4 transition-all duration-300 ease-in-out rounded-lg">
              <div className="max-w-7xl mx-auto flex justify-between items-center">
                <p className="text-2xl font-semibold">
                  {formatPrice(currentPrice)}
                </p>
                <CheckoutButton productId={productId} label={checkoutLabel} />
              </div>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
          <div className="relative bg-white rounded-lg p-4 max-w-2xl w-full">
            <img
              src={modalImage}
              alt={title}
              className="w-full h-auto object-contain rounded-lg"
            />
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 bg-white rounded-full p-2 shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </Container>
  );
};

export default ProductPage;
