import ListingDeleteButton from "./ListingDeleteButton";

interface Props {
  listing_id: string;
  edit: boolean;
}

const ListingFooter = ({ listing_id, edit }: Props) => {
  if (!edit) {
    return <></>;
  }

  return (
    <div className="flex justify-end border-t p-4">
      <ListingDeleteButton listing_id={listing_id} />
    </div>
  );
};

export default ListingFooter;
