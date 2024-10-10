import React from "react";
import { Link } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

const OrderCancel: React.FC = () => {
  return (
    <div className="pt-4 min-h-screen">
      <Card className="mt-8">
        <CardContent className="p-6 flex flex-col items-center">
          <XCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Order Cancelled</h2>
          <p className="text-center mb-4">
            Your order has been cancelled. No charges were made to your account.
          </p>
          <Button asChild>
            <Link to="/">Return to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderCancel;
