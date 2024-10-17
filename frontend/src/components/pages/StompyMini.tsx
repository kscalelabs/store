import React from "react";

import Container from "@/components/Container";
import CheckoutButton from "@/components/stripe/CheckoutButton";

const StompyMini: React.FC = () => {
  return (
    <Container>
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-bold">Stompy Mini</h1>
        <p className="text-xl text-gray-11">PAGE IS UNDER CONSTRUCTION</p>
        {/* Developer Mode Stompy Mini */}
        {/* <CheckoutButton
          productId="prod_R1I3mYImsmLKGe"
          label="Buy Stompy Mini"
        /> */}
        {/* Production Stompy Mini */}
        <CheckoutButton
          productId="prod_R1IAtdBONHzXCb"
          label="Buy Stompy Mini"
        />
      </div>
    </Container>
  );
};

export default StompyMini;
