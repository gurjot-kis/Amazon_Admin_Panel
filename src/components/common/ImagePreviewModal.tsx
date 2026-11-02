import React, { useEffect } from "react";
import { MdClose } from "react-icons/md";
import "../../styles/ImagePreviewModal.css";

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl?: string | null;
  altText?: string;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  imageUrl,
  altText = "Preview",
  onClose,
}) => {
  // Close on Escape key press & prevent background scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="image-preview-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="image-preview-container"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="image-preview-close"
          onClick={onClose}
          aria-label="Close Preview"
        >
          <MdClose />
        </button>
        <div className="image-preview-body">
          <img
            src={imageUrl}
            alt={altText}
            className="image-preview-img"
          />
        </div>
      </div>
    </div>
  );
};