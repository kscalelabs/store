interface Props {
  title: string;
  // TODO: If can edit, allow the user to update the title.
  edit: boolean;
}

const ListingTitle = (props: Props) => {
  const { title } = props;
  return (
    <div className="mb-3">
      <h1 className="text-3xl font-semibold">{title}</h1>
    </div>
  );
};

export default ListingTitle;
