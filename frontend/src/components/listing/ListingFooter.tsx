import ListingDeleteButton from "components/listing/ListingDeleteButton";

interface Props {
  listingId: string;
  edit: boolean;
}

const ListingFooter = ({ listingId, edit }: Props) => {
  return (
    <div className="relative p-4">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
        <div className="text-gray-600 dark:text-gray-300 italic text-sm">
          {`Listing ID: ${listingId}`}
        </div>
        {edit && (
          <div className="flex justify-end gap-2">
            <ListingDeleteButton listingId={listingId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingFooter;
