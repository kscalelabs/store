import { useEffect, useRef, useState } from "react";
import { FaCheck, FaEye, FaPen } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import Container from "@/components/Container";
import ListingDeleteButton from "@/components/listing/ListingDeleteButton";
import { RenderDescription } from "@/components/listing/ListingDescription";
import ListingVoteButtons from "@/components/listing/ListingVoteButtons";
import CheckoutButton from "@/components/stripe/CheckoutButton";
import { Input, TextArea } from "@/components/ui/Input/Input";
import Spinner from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils/formatNumber";
import { formatNumber } from "@/lib/utils/formatNumber";
import { formatTimeSince } from "@/lib/utils/formatTimeSince";

const FALLBACK_IMAGE =
  "https://miro.medium.com/v2/resize:fit:720/format:webp/1*gTRwcZ8ZBLvFtWw9-fq9_w.png";

interface ProductPageProps {
  productId: string;
  checkoutLabel: string;
  title: string;
  description: string;
  features?: string[];
  price: number;
  images: string[];
  onImageClick?: (image: string) => void;
  creatorName?: string;
  creatorId?: string;
}

const ProductPage: React.FC<ProductPageProps> = ({
  productId,
  checkoutLabel,
  title,
  description: initialDescription,
  features = [],
  price,
  images = [],
  onImageClick,
}) => {
  const navigate = useNavigate();
  const auth = useAuthentication();
  const [creatorInfo, setCreatorInfo] = useState<{
    name: string | null;
    id: string;
    views: number;
    created_at: number;
    slug: string | null;
    can_edit: boolean;
    score: number;
    user_vote: number | null;
  } | null>(null);

  useEffect(() => {
    const fetchCreatorInfo = async () => {
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
        });
      }
    };

    fetchCreatorInfo();
  }, [productId, auth.client]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (fadeOut) {
      const timer = setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        setFadeOut(false);
      }, 300); // Match this with the CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [fadeOut, images.length]);

  const nextImage = () => setFadeOut(true);
  const prevImage = () => {
    setFadeOut(true);
    setCurrentImageIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length,
    );
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

  const displayImages = images.length > 0 ? images : [FALLBACK_IMAGE];
  const showNavigation = displayImages.length > 1;

  const { addAlert, addErrorAlert } = useAlertQueue();
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

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

  return (
    <Container>
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
              <img
                src={displayImages[currentImageIndex]}
                alt={`${title} - Image ${currentImageIndex + 1}`}
                className={`w-full h-auto rounded-lg shadow-lg object-cover transition-opacity duration-300 ${
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
                  </p>
                  <div className="mt-2 text-sm text-muted-foreground flex items-center gap-4 flex-wrap">
                    <div className="flex items-center">
                      <FaEye className="mr-1" />
                      <span>{formatNumber(creatorInfo.views)} views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      Posted{" "}
                      {formatTimeSince(new Date(creatorInfo.created_at * 1000))}
                      {creatorInfo.can_edit && (
                        <>
                          {isEditingSlug ? (
                            <div className="flex flex-col space-y-2">
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

        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayImages.map((image, index) => (
              <div
                key={index}
                className="aspect-square overflow-hidden rounded-lg shadow-md cursor-pointer"
                onClick={() => onImageClick && onImageClick(image)}
              >
                <img
                  src={image}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        {isFixed && (
          <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md p-4 transition-all duration-300 ease-in-out z-10">
            <div className="max-w-7xl mx-auto flex justify-between items-center px-6">
              <p className="text-2xl font-semibold">{formatPrice(price)}</p>
              <CheckoutButton productId={productId} label={checkoutLabel} />
            </div>
          </div>
        )}

        <div className="relative left-0 right-0 bg-white shadow-md p-4 transition-all duration-300 ease-in-out rounded-lg">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <p className="text-2xl font-semibold">{formatPrice(price)}</p>
            <CheckoutButton productId={productId} label={checkoutLabel} />
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden">
            <img
              src={modalImage}
              alt={title}
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all duration-300"
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
