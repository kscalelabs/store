import { FaEye } from "react-icons/fa";

interface Props {
  creatorId: string;
  creatorName: string | null;
  creatorUsername: string | null;
  views: number;
  createdAt: number;
}

const ListingMetadata = ({
  creatorId,
  creatorName,
  creatorUsername,
  views,
  createdAt,
}: Props) => {
  return (
    <>
      <div className="flex items-center gap-2 text-sm mb-2">
        <span>Listed by</span>
        <a
          href={`/profile/${creatorId}`}
          className="text-blue-500 hover:underline"
        >
          {creatorName ?? creatorUsername ?? "Creator"}
        </a>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <FaEye /> {views} views
        </span>
        <span>Posted {new Date(createdAt * 1000).toLocaleDateString()}</span>
      </div>
    </>
  );
};

export default ListingMetadata;
