import CheckoutButton from "@/components/stripe/CheckoutButton";
import { formatPrice } from "@/lib/utils/formatNumber";

interface Props {
  listingId: string;
  stripeProductId: string;
  priceAmount: number;
  inventoryType: "finite" | "infinite" | "preorder";
  inventoryQuantity?: number;
  preorderReleaseDate?: number;
  isReservation: boolean;
  reservationDepositAmount?: number;
}

const ListingPayment = ({
  listingId,
  stripeProductId,
  priceAmount,
  inventoryType,
  inventoryQuantity,
  preorderReleaseDate,
  isReservation,
  reservationDepositAmount,
}: Props) => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Purchase Information</h3>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span>Price:</span>
          <span className="font-semibold">{formatPrice(priceAmount)}</span>
        </div>

        {isReservation && reservationDepositAmount && (
          <div className="flex justify-between text-sm text-gray-2">
            <span>Reservation Deposit:</span>
            <span>{formatPrice(reservationDepositAmount)}</span>
          </div>
        )}

        {inventoryType === "finite" && inventoryQuantity !== undefined && (
          <div className="flex justify-between text-sm text-gray-2">
            <span>Available Units:</span>
            <span>{inventoryQuantity}</span>
          </div>
        )}

        {inventoryType === "preorder" && preorderReleaseDate && (
          <div className="flex justify-between text-sm text-gray-2">
            <span>Release Date:</span>
            <span>
              {new Date(preorderReleaseDate * 1000).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <CheckoutButton
          listingId={listingId}
          stripeProductId={stripeProductId}
          label="Purchase Now"
          inventoryType={inventoryType}
          inventoryQuantity={inventoryQuantity}
        />
      </div>
    </div>
  );
};

export default ListingPayment;
