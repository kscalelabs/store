import React from "react";

import ProductPage from "@/components/products/ProductPage";
import stompy from "@/images/stompy.png";

const StompyMini: React.FC = () => {
  const images = [stompy, stompy, stompy, stompy];

  const productInfo = {
    name: "Stompy Mini",
    description:
      "Introducing the Stompy Mini, a compact and customizable 3D-printed robot kit for your desktop or workbench. Perfect for hobbyists, makers, and STEM enthusiasts, this DIY robot brings advanced robotics to your fingertips at an affordable price.",
    specs: [
      "Height: 12 inches (30 cm)",
      "3D-printable parts for easy customization",
      "Arduino-compatible microcontroller",
      "Modular design for easy assembly",
      "Beginner-friendly programming interface",
    ],
    features: [
      "Step-by-step assembly guide",
      "Basic movement and sensor capabilities",
      "Expandable with additional modules",
      "Open-source software and hardware",
      "Active community for support and ideas",
      "Regular firmware updates",
    ],
    price: 35000,
    productId: "prod_R1IAtdBONHzXCb",
  };

  return (
    <ProductPage
      images={images}
      productId={productInfo.productId}
      checkoutLabel="Buy Stompy Mini"
      title={productInfo.name}
      description={productInfo.description}
      features={productInfo.features}
      keyFeatures={productInfo.specs}
      price={productInfo.price}
    />
  );
};

export default StompyMini;
