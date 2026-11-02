import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  useUploadAdminCouponImageMutation,
  useUploadVendorCouponImageMutation,
} from "../features/coupon/couponAPI";
import "../styles/coupon/UploadCouponImageModal.css";

interface UploadCouponImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  couponId: string;
  role: "admin" | "vendor";
  initialWebsiteImage?: string | null;
  initialMobileImage?: string | null;
}

interface ImageSlotState {
  file: File | null;
  previewUrl: string | null;
  isExisting: boolean;
  isDragging: boolean;
}

export const UploadCouponImageModal: React.FC<UploadCouponImageModalProps> = ({
  isOpen,
  onClose,
  couponId,
  role,
  initialWebsiteImage,
  initialMobileImage,
}) => {
  const [adminUpload, { isLoading: isAdminUploading }] =
    useUploadAdminCouponImageMutation();
  const [vendorUpload, { isLoading: isVendorUploading }] =
    useUploadVendorCouponImageMutation();

  const isUploading = isAdminUploading || isVendorUploading;

  const [websiteSlot, setWebsiteSlot] = useState<ImageSlotState>({
    file: null,
    previewUrl: null,
    isExisting: false,
    isDragging: false,
  });

  const [mobileSlot, setMobileSlot] = useState<ImageSlotState>({
    file: null,
    previewUrl: null,
    isExisting: false,
    isDragging: false,
  });

  const websiteInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial images when modal opens
  useEffect(() => {
    if (isOpen) {
      const assetBase = import.meta.env.VITE_API_ASSET_URL || "";

      setWebsiteSlot({
        file: null,
        previewUrl: initialWebsiteImage
          ? initialWebsiteImage.startsWith("http")
            ? initialWebsiteImage
            : `${assetBase}${initialWebsiteImage}`
          : null,
        isExisting: Boolean(initialWebsiteImage),
        isDragging: false,
      });

      setMobileSlot({
        file: null,
        previewUrl: initialMobileImage
          ? initialMobileImage.startsWith("http")
            ? initialMobileImage
            : `${assetBase}${initialMobileImage}`
          : null,
        isExisting: Boolean(initialMobileImage),
        isDragging: false,
      });
    }
  }, [isOpen, initialWebsiteImage, initialMobileImage]);

  if (!isOpen) return null;

  const handleFileSelection = (
    file: File | undefined,
    type: "website" | "mobile",
  ) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file format", {
        description: "Please select an image file (PNG, JPG, WEBP, etc.)",
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const updater = type === "website" ? setWebsiteSlot : setMobileSlot;
    updater({
      file,
      previewUrl,
      isExisting: false,
      isDragging: false,
    });
  };

  const handleDragEvents = (
    e: React.DragEvent<HTMLDivElement>,
    type: "website" | "mobile",
    isDragging: boolean,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const updater = type === "website" ? setWebsiteSlot : setMobileSlot;
    updater((prev) => ({ ...prev, isDragging }));
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    type: "website" | "mobile",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const updater = type === "website" ? setWebsiteSlot : setMobileSlot;
    updater((prev) => ({ ...prev, isDragging: false }));

    const droppedFile = e.dataTransfer.files?.[0];
    handleFileSelection(droppedFile, type);
  };

  const clearSlot = (type: "website" | "mobile", e: React.MouseEvent) => {
    e.stopPropagation();
    const updater = type === "website" ? setWebsiteSlot : setMobileSlot;
    updater({
      file: null,
      previewUrl: null,
      isExisting: false,
      isDragging: false,
    });
  };

  const handleUploadSubmit = async () => {
    if (!couponId) {
      toast.error(
        "Please save the coupon first before uploading banner images.",
      );
      return;
    }

    if (!websiteSlot.file && !mobileSlot.file) {
      toast.info("No new images were selected to upload.");
      return;
    }

    const uploadFn = role === "admin" ? adminUpload : vendorUpload;
    const uploadTasks: Promise<any>[] = [];

    if (websiteSlot.file) {
      uploadTasks.push(
        uploadFn({
          couponId,
          image: websiteSlot.file,
          coupon_image_type: "website",
        }).unwrap(),
      );
    }

    if (mobileSlot.file) {
      uploadTasks.push(
        uploadFn({
          couponId,
          image: mobileSlot.file,
          coupon_image_type: "mobile",
        }).unwrap(),
      );
    }

    try {
      // Execute uploads in parallel
      await Promise.all(uploadTasks);

      toast.success(
        uploadTasks.length === 2
          ? "Both website & mobile images uploaded successfully!"
          : "Image uploaded successfully!",
      );
      onClose();
    } catch (err: any) {
      // If concurrent upload fails on your backend, fallback sequentially
      console.error("Parallel upload failed, trying sequential:", err);

      try {
        if (websiteSlot.file) {
          await uploadFn({
            couponId,
            image: websiteSlot.file,
            coupon_image_type: "website",
          }).unwrap();
        }
        if (mobileSlot.file) {
          await uploadFn({
            couponId,
            image: mobileSlot.file,
            coupon_image_type: "mobile",
          }).unwrap();
        }
        toast.success("Images uploaded successfully!");
        onClose();
      } catch (sequentialErr: any) {
        toast.error("Upload failed", {
          description:
            sequentialErr?.data?.message ||
            err?.data?.message ||
            "Failed to upload coupon image(s).",
        });
      }
    }
  };

  return (
    <div className="ucim-overlay" onClick={onClose}>
      <div
        className="ucim-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ucim-header">
          <div className="ucim-header-title">
            <h2>Upload Coupon Banner Images</h2>
            <p>
              View current banners or drag & drop to replace them. Role:{" "}
              <span className="ucim-role-tag">{role.toUpperCase()}</span>
            </p>
          </div>
          <button
            type="button"
            className="ucim-close-btn"
            onClick={onClose}
            disabled={isUploading}
          >
            <svg
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="ucim-body">
          {/* Website Banner */}
          <div className="ucim-drop-card">
            <div className="ucim-slot-label-bar">
              <div>
                <h4>Upload Image for Website</h4>
                <span>Recommended: 1200 × 500 px (Landscape Banner)</span>
              </div>
              {websiteSlot.previewUrl && (
                <div className="ucim-slot-status-group">
                  <span
                    className={`ucim-status-badge ${websiteSlot.file ? "is-new" : "is-current"}`}
                  >
                    {websiteSlot.file ? "New File Selected" : "Current Active"}
                  </span>
                  {websiteSlot.file && (
                    <button
                      type="button"
                      className="ucim-clear-btn"
                      onClick={(e) => clearSlot("website", e)}
                      disabled={isUploading}
                    >
                      Reset
                    </button>
                  )}
                </div>
              )}
            </div>

            <div
              className={`ucim-dropzone ${websiteSlot.isDragging ? "is-dragging" : ""} ${
                websiteSlot.previewUrl ? "has-preview" : ""
              }`}
              onDragOver={(e) => handleDragEvents(e, "website", true)}
              onDragEnter={(e) => handleDragEvents(e, "website", true)}
              onDragLeave={(e) => handleDragEvents(e, "website", false)}
              onDrop={(e) => handleDrop(e, "website")}
              onClick={() => websiteInputRef.current?.click()}
            >
              <input
                ref={websiteInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) =>
                  handleFileSelection(e.target.files?.[0], "website")
                }
              />

              {websiteSlot.previewUrl ? (
                <div className="ucim-preview-wrap">
                  <img src={websiteSlot.previewUrl} alt="Website preview" />
                  <div className="ucim-preview-overlay">
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    <span>Click or drop new image to replace</span>
                  </div>
                </div>
              ) : (
                <div className="ucim-placeholder">
                  <div className="ucim-icon-bubble">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="ucim-drop-title">
                    Drag & drop website banner here, or <span>Browse</span>
                  </p>
                  <p className="ucim-drop-hint">
                    Supports PNG, JPG, WEBP (Max 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Banner */}
          <div className="ucim-drop-card">
            <div className="ucim-slot-label-bar">
              <div>
                <h4>Upload Image for Mobile</h4>
                <span>Recommended: 600 × 800 px or 1:1 Aspect Ratio</span>
              </div>
              {mobileSlot.previewUrl && (
                <div className="ucim-slot-status-group">
                  <span
                    className={`ucim-status-badge ${mobileSlot.file ? "is-new" : "is-current"}`}
                  >
                    {mobileSlot.file ? "New File Selected" : "Current Active"}
                  </span>
                  {mobileSlot.file && (
                    <button
                      type="button"
                      className="ucim-clear-btn"
                      onClick={(e) => clearSlot("mobile", e)}
                      disabled={isUploading}
                    >
                      Reset
                    </button>
                  )}
                </div>
              )}
            </div>

            <div
              className={`ucim-dropzone ${mobileSlot.isDragging ? "is-dragging" : ""} ${
                mobileSlot.previewUrl ? "has-preview" : ""
              }`}
              onDragOver={(e) => handleDragEvents(e, "mobile", true)}
              onDragEnter={(e) => handleDragEvents(e, "mobile", true)}
              onDragLeave={(e) => handleDragEvents(e, "mobile", false)}
              onDrop={(e) => handleDrop(e, "mobile")}
              onClick={() => mobileInputRef.current?.click()}
            >
              <input
                ref={mobileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) =>
                  handleFileSelection(e.target.files?.[0], "mobile")
                }
              />

              {mobileSlot.previewUrl ? (
                <div className="ucim-preview-wrap">
                  <img src={mobileSlot.previewUrl} alt="Mobile preview" />
                  <div className="ucim-preview-overlay">
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    <span>Click or drop new image to replace</span>
                  </div>
                </div>
              ) : (
                <div className="ucim-placeholder">
                  <div className="ucim-icon-bubble">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <rect
                        x="5"
                        y="2"
                        width="14"
                        height="20"
                        rx="2"
                        ry="2"
                        strokeWidth="1.8"
                      />
                      <line
                        x1="12"
                        y1="18"
                        x2="12.01"
                        y2="18"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <p className="ucim-drop-title">
                    Drag & drop mobile banner here, or <span>Browse</span>
                  </p>
                  <p className="ucim-drop-hint">
                    Supports PNG, JPG, WEBP (Max 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="ucim-footer">
          <button
            type="button"
            className="ucim-btn-subtle"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ucim-btn-primary"
            onClick={handleUploadSubmit}
            disabled={isUploading || (!websiteSlot.file && !mobileSlot.file)}
          >
            {isUploading ? (
              <>
                <span className="ucim-spinner" />
                <span>Uploading...</span>
              </>
            ) : (
              "Save & Update Images"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
