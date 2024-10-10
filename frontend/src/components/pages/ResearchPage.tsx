import React, { useEffect, useState } from "react";

import Spinner from "@/components/ui/Spinner";

interface ResearchPost {
  title: string;
  pubDate: string;
  link: string;
  description: string;
  content: string;
  author: string;
}

const MediumArticles: React.FC = () => {
  const [articles, setArticles] = useState<ResearchPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch(
          "https://api.rss2json.com/v1/api.json?rss_url=https://blog.kscale.dev/feed",
        );
        const data = await response.json();
        if (data.status === "ok") {
          setArticles(data.items);
        } else {
          throw new Error("Failed to fetch articles.");
        }
        setLoading(false);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="container mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-6">
      {articles.map((article, index) => (
        <MediumCard key={index} article={article} />
      ))}
    </div>
  );
};

const extractImages = (htmlContent: string): string[] => {
  const regex = /<img[^>]+src="([^">]+)"/g;
  const images: string[] = [];
  let match;
  while ((match = regex.exec(htmlContent)) !== null) {
    images.push(match[1]);
  }
  return images;
};

const MediumCard: React.FC<{ article: ResearchPost }> = ({ article }) => {
  const images = extractImages(article.content);

  const fallbackImage =
    "https://miro.medium.com/v2/resize:fit:720/format:webp/1*gTRwcZ8ZBLvFtWw9-fq9_w.png";
  const randomImage =
    images.length > 0
      ? images[Math.floor(Math.random() * images.length)]
      : fallbackImage;

  const authorImage =
    article.author.toLowerCase() === "ben bolte"
      ? "https://miro.medium.com/v2/resize:fill:176:176/1*EuQxKArtHb0orCJcWTPHkA.jpeg"
      : article.author.toLowerCase() === "paweł budzianowski"
        ? "https://miro.medium.com/v2/resize:fill:40:40/1*REeM2VDUPg7VWMU1UwnsBw.png"
        : "https://miro.medium.com/v2/resize:fill:40:40/1*REeM2VDUPg7VWMU1UwnsBw.png";

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300">
      <div className="eu m ev ew ex ey">
        <a
          href={article.link}
          className="flex mb-4"
          style={{ position: "relative" }}
        >
          <img
            src={randomImage}
            alt={article.title}
            className="m ke kf kg kh w-full object-cover rounded-t-lg h-56"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackImage;
            }}
          />
        </a>

        <div className="p-4">
          <div className="flex items-center mb-4">
            <img
              src={authorImage}
              alt={article.author}
              className="rounded-full h-10 w-10"
            />
            <div className="ml-3">
              <p className="text-gray-700 font-bold">{article.author}</p>
              <p className="text-sm text-gray-500">
                {new Date(article.pubDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <a href={article.link} className="block">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 hover:underline">
              {article.title}
            </h2>
            <p className="text-sm text-gray-600 line-clamp-3 mb-4">
              {article.description.replace(/<\/?[^>]+(>|$)/g, "")}
            </p>
          </a>
        </div>

        <div className="flex justify-between items-center">
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            Read More
          </a>
        </div>
      </div>
    </div>
  );
};

export default MediumArticles;
