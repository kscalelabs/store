import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";

interface DownloadConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  fileName: string;
  fileSize: string;
}

const DownloadConfirmationModal = ({
  isOpen,
  onClose,
  onDownload,
  fileName,
  fileSize,
}: DownloadConfirmationModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-8 bg-gray-12 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-2">
          Download Kernel Image
        </h2>
        <div className="mb-6 space-y-2 text-gray-7">
          <p>Are you sure you want to download this kernel image?</p>
          <p>
            <span className="text-gray-2 font-bold mb-4">File: </span>
            {fileName}
          </p>
          <p>
            <span className="text-gray-2 front-bold mb-4">Size: </span>
            {fileSize}
          </p>
        </div>
        <div className="flex justify-end space-x-4">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={() => {
              onDownload();
              onClose();
            }}
            variant="default"
          >
            Download
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DownloadConfirmationModal;
