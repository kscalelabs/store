import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const OrderSuccess: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const session_id = searchParams.get("session_id");
    setSessionId(session_id);

    // Here you could make an API call to your backend to verify the order
    // and fetch additional order details if needed
  }, [location]);

  return (
    <div className="pt-4 min-h-screen">
      <Card className="mt-8">
        <CardContent className="p-6 flex flex-col items-center">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Order Successful!</h2>
          <p className="text-center mb-4">
            Thank you for your purchase. Your order has been successfully
            processed.
          </p>
          {sessionId && (
            <p className="text-sm text-gray-500 mb-4">Order ID: {sessionId}</p>
          )}
          <Button asChild>
            <a href="/">Return to Home</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSuccess;
