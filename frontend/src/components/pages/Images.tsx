import React, { useState, useEffect } from "react";
import { FaDownload } from "react-icons/fa";
import { Button } from "components/ui/Button/Button";
import Spinner from "components/ui/Spinner";
import { useAuthentication } from "hooks/useAuth";
import { humanReadableError, useAlertQueue } from "hooks/useAlertQueue";

const DownloadImage = () => {
  const [downloading, setDownloading] = useState(false);
  const [latestImage, setLatestImage] = useState(null);
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  useEffect(() => {
    const fetchLatestImage = async () => {
      try {
        const { data, error } = await auth.client.GET("/artifacts/latest/image");
        if (error) {
          throw new Error(humanReadableError(error));
        }
        setLatestImage(data);
      } catch (error) {
        console.error("Error fetching the latest image:", error);
        addErrorAlert(error.message);
      }
    };

    fetchLatestImage();
  }, [auth.client, addErrorAlert]);

  const handleDownload = async () => {
    if (!latestImage) return;

    setDownloading(true);
    try {
      const downloadResponse = await fetch(latestImage.urls.large);
      const blob = await downloadResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = latestImage.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading the artifact:", error);
      addErrorAlert(error.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black p-8">
      <div className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0 md:space-x-8">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold mb-4">Info</h1>
          <p className="text-l mb-2">blah blah</p>
          <p className="text-l">v{latestImage?.version || '0.1'}</p>
        </div>
        
        <div className="bg-gray-100 dark:bg-[#111111] p-8 rounded-lg flex flex-col justify-center w-full md:w-[28rem]">
          <h2 className="text-3xl font-bold mb-6">Download K-ernel Image</h2>
          <Button
            onClick={handleDownload}
            variant="primary"
            className="w-full"
            disabled={downloading || !latestImage}
          >
            {downloading ? (
              <Spinner className="mr-2" />
            ) : (
              <FaDownload className="mr-2" />
            )}
            {downloading ? "Downloading..." : "Download"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DownloadImage;
