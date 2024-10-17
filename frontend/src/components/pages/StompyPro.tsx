import React from "react";

import ProductPage from "@/components/products/ProductPage";
import stompy from "@/images/stompy.png";

const StompyPro: React.FC = () => {
  const images = [stompy, stompy, stompy, stompy];

  const productInfo = {
    name: "Stompy Pro",
    description:
      "Introducing the Stompy Pro, a cutting-edge 5-foot tall humanoid robot designed to revolutionize your home or business. With advanced AI capabilities and robust construction, Stompy Pro is the perfect assistant for a wide range of tasks.",
    specs: [
      "Height: 5 feet (152 cm)",
      "Advanced AI-powered decision making",
      "Durable all-terrain design",
      "Voice-activated commands",
      "Customizable appearance",
    ],
    features: [
      "Autonomous navigation",
      "Object recognition and manipulation",
      "Natural language processing",
      "Wireless connectivity",
      "Expandable functionality through apps",
      "Regular software updates",
    ],
    price: 15000,
    productId: "prod_R0n3nkCO4aQdlg",
  };

  return (
    <ProductPage
      images={images}
      productId={productInfo.productId}
      checkoutLabel="Buy Stompy Pro"
      title={productInfo.name}
      description={productInfo.description}
      features={productInfo.features}
      keyFeatures={productInfo.specs}
      price={productInfo.price.toString()}
    />
  );
};

export default StompyPro;
