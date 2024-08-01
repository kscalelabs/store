interface Props {
  child_ids: string[];
  // TODO: If can, allow the user to add and delete children.
  edit: boolean;
}

const ListingChildren = (props: Props) => {
  const { child_ids } = props;
  return (
    <div className="mb-3">
      {child_ids.map((id) => (
        <p key={id}>{id}</p>
      ))}
    </div>
  );
};

export default ListingChildren;
