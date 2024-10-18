import { useEffect, useRef, useState } from "react";

import Container from "@/components/Container";
import CheckoutButton from "@/components/stripe/CheckoutButton";
import { formatPrice } from "@/lib/utils/formatNumber";

interface Props {
  productId: string;
  checkoutLabel: string;
  title: string;
  description: string;
  features: string[];
  keyFeatures: string[];
  price: number;
  images: string[];
}

const ProductPage = ({
  productId,
  checkoutLabel,
  title,
  description,
  features,
  keyFeatures,
  price,
  images,
}: Props) => {
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

  return (
    <Container>
      <div ref={contentRef}>
        <div className="flex flex-col lg:flex-row items-start justify-between max-w-7xl mx-auto py-12 gap-12 mb-24">
          <div className="w-full lg:w-1/2 relative">
            <img
              src={images[currentImageIndex]}
              alt={`${title} - Image ${currentImageIndex + 1}`}
              className={`w-full h-auto rounded-lg shadow-lg object-cover transition-opacity duration-300 ${
                fadeOut ? "opacity-0" : "opacity-100"
              } cursor-pointer`}
              onClick={() => openModal(images[currentImageIndex])}
            />
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
          </div>

          <div className="w-full lg:w-1/2">
            <h1 className="text-4xl font-bold mb-8">{title}</h1>

            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">
                Product Description
              </h2>
              <p className="text-gray-700 mb-4">{description}</p>
              <ul className="list-disc list-inside text-gray-700">
                {features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
              <ul className="list-disc list-inside text-gray-700">
                {keyFeatures.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {images.map((img, index) => (
              <div
                key={index}
                className="aspect-square overflow-hidden rounded-lg shadow-md cursor-pointer"
                onClick={() => openModal(img)}
              >
                <img
                  src={img}
                  alt={`${title} Detail ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
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

      {/* Image Modal */}
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
