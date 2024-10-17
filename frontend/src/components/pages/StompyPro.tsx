import React from "react";

import Container from "@/components/Container";
import CheckoutButton from "@/components/stripe/CheckoutButton";

const StompyPro: React.FC = () => {
  return (
    <Container>
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-bold">Stompy Pro</h1>
        <p className="text-xl text-gray-11">PAGE IS UNDER CONSTRUCTION</p>
        {/* Developer Mode Stompy Pro */}
        {/* <CheckoutButton productId="prod_Qyzd8f0gFMis7c" /> */}
        {/* Production Stompy Pro */}
        <CheckoutButton productId="prod_R0n3nkCO4aQdlg" />
      </div>
    </Container>
  );
};

export default StompyPro;
