import React, { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/Card";
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
    return <p className="text-gray-12">Error: {error}</p>;
  }

  return (
    <div className="container mx-auto mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 p-6">
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

  return (
    <Card className="bg-black border-gray-700 hover:border-white transition-all duration-300">
      <CardContent className="p-0 flex flex-col">
        <a
          href={article.link}
          className="block w-full"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={randomImage}
            alt={article.title}
            className="w-full h-40 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackImage;
            }}
          />
        </a>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <img
              src={getAuthorImage(article.author)}
              alt={article.author}
              className="rounded-full h-6 w-6"
            />
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{article.author}</span>
              <span>·</span>
              <span>{new Date(article.pubDate).toLocaleDateString()}</span>
            </div>
          </div>

          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <h2 className="text-lg font-medium text-white mb-2 hover:underline line-clamp-2">
              {article.title}
            </h2>
            <p className="text-sm text-gray-400 line-clamp-2 mb-4">
              {article.description.replace(/<\/?[^>]+(>|$)/g, "")}
            </p>
          </a>

          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white hover:underline"
          >
            Read More
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

const getAuthorImage = (author: string): string => {
  switch (author.toLowerCase()) {
    case "ben bolte":
      return "https://miro.medium.com/v2/resize:fill:176:176/1*EuQxKArtHb0orCJcWTPHkA.jpeg";
    case "paweł budzianowski":
      return "https://miro.medium.com/v2/resize:fill:40:40/1*REeM2VDUPg7VWMU1UwnsBw.png";
    default:
      return "https://miro.medium.com/v2/resize:fill:40:40/1*REeM2VDUPg7VWMU1UwnsBw.png";
  }
};

export default MediumArticles;
