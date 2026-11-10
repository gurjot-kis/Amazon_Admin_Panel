import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  MdCloudUpload,
  MdDeleteOutline,
  MdArrowBack,
  MdSave,
  MdStorefront,
  MdTitle,
  MdLink,
  MdDateRange,
  MdSort,
  MdImage,
  MdSmartphone,
  MdLanguage,
  MdOpenInNew,
  MdLayers,
} from "react-icons/md";

import {
  useCreateBannerMutation,
  useGetBannerByIdQuery,
  useUpdateBannerMutation,
} from "../../../features/banner/bannerApi";
import { useFetchVendorActiveStoresQuery } from "../../../features/store/storeApi";
import type {
  BannerDeviceType,
  BannerPosition,
  BannerRedirectType,
  BannerUploadArea,
} from "../../../features/banner/bannerTypes";
import { DatePickerInput } from "../../../components/common/DatePickerInput";
import { useHeader } from "../../../layout/LayoutContext";

import "../../../styles/banner/CreateBanner.css";
import { FullScreenLoader } from "../../../components/common/FullScreenLoader";

const ASSET_URL = (import.meta.env.VITE_API_ASSET_URL as string) || "";

interface BannerFormState {
  title: string;
  description: string;
  store_id: string;
  redirect_url: string;
  redirect_type: BannerRedirectType;
  upload_area: BannerUploadArea;
  position: BannerPosition;
  device_type: BannerDeviceType;
  sort_order: number;
  start_date: string; // strictly "YYYY-MM-DD"
  end_date: string; // strictly "YYYY-MM-DD"
}

const INITIAL_FORM: BannerFormState = {
  title: "",
  description: "",
  store_id: "",
  redirect_url: "",
  redirect_type: "none",
  upload_area: "app",
  position: "home_top",
  device_type: "all",
  sort_order: 0,
  start_date: "",
  end_date: "",
};

const POSITION_LABELS: Record<BannerPosition, string> = {
  home_top: "Top of Home",
  home_middle: "Middle of Home",
  home_bottom: "Bottom of Home",
  category: "Category Page",
  product: "Product Page",
  promotional: "Promotional",
};

// Converts any incoming date string (ISO timestamp, with/without time) strictly to "YYYY-MM-DD"
const sanitizeDateOnly = (dateStr?: string | null): string => {
  if (!dateStr) return "";
  try {
    // If it already starts with YYYY-MM-DD, extract it safely
    const cleanStr = String(dateStr).trim();
    if (cleanStr.includes("T")) {
      return cleanStr.split("T")[0];
    }
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
};

const CreateBanner: React.FC = () => {
  const { id: bannerId } = useParams<{ id: string }>();
  const isEditMode = Boolean(bannerId);
  const navigate = useNavigate();
  const { setHeaderConfig } = useHeader();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<BannerFormState>(INITIAL_FORM);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: storeData } = useFetchVendorActiveStoresQuery();
  const {
    data: bannerData,
    isLoading: isFetchingBanner,
    isError: isBannerFetchError,
  } = useGetBannerByIdQuery(bannerId as string, {
    skip: !isEditMode,
  });

  const [createBanner, { isLoading: isCreating }] = useCreateBannerMutation();
  const [updateBanner, { isLoading: isUpdating }] = useUpdateBannerMutation();

  const activeStores = storeData?.data ?? [];

  useEffect(() => {
    setHeaderConfig({
      title: isEditMode ? "Edit Banner" : "Create Banner",
    });
  }, [setHeaderConfig, isEditMode]);

  useEffect(() => {
    if (!isEditMode && activeStores.length > 0 && !formData.store_id) {
      setFormData((prev) => ({ ...prev, store_id: activeStores[0]._id }));
    }
  }, [activeStores, isEditMode, formData.store_id]);

  // Populate data when editing
  useEffect(() => {
    if (isEditMode && bannerData?.data) {
      const banner = bannerData.data;

      setFormData({
        title: banner.title || "",
        description: banner.description || "",
        store_id: banner.store_id || "",
        redirect_url: banner.redirect_url || "",
        redirect_type: banner.redirect_type || "none",
        upload_area: banner.upload_area || "app",
        position: banner.position || "home_top",
        device_type: banner.device_type || "all",
        sort_order: banner.sort_order ?? 0,
        start_date: sanitizeDateOnly(banner.start_date),
        end_date: sanitizeDateOnly(banner.end_date),
      });

      if (banner.banner_image) {
        setImagePreview(
          banner.banner_image.startsWith("http")
            ? banner.banner_image
            : `${ASSET_URL}${banner.banner_image}`,
        );
      }
    }
  }, [isEditMode, bannerData]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "sort_order" ? Number(value) : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleDateChange = (field: "start_date" | "end_date", val: string) => {
    const cleanDate = sanitizeDateOnly(val);
    setFormData((prev) => ({
      ...prev,
      [field]: cleanDate,
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size exceeds 5MB limit.");
      return;
    }

    setBannerFile(file);
    setImagePreview(URL.createObjectURL(file));

    if (errors.banner_image) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.banner_image;
        return next;
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBannerFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Title is required.";
    if (!formData.store_id) newErrors.store_id = "Please select a store.";
    if (!isEditMode && !bannerFile) {
      newErrors.banner_image = "Banner image is required.";
    }
    if (formData.redirect_type !== "none" && !formData.redirect_url.trim()) {
      newErrors.redirect_url = "Redirect path is required.";
    }
    if (
      formData.start_date &&
      formData.end_date &&
      formData.start_date > formData.end_date
    ) {
      newErrors.end_date = "End date must be on or after start date.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please complete the required fields.");
      return;
    }

    try {
      const formattedStartDate = formData.start_date
        ? `${formData.start_date}T00:00:00.000Z`
        : undefined;
      const formattedEndDate = formData.end_date
        ? `${formData.end_date}T23:59:59.000Z`
        : undefined;

      if (isEditMode) {
        await updateBanner({
          bannerId: bannerId as string,
          ...formData,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          ...(bannerFile ? { banner_image: bannerFile } : {}),
        }).unwrap();
        toast.success("Banner updated successfully!");
      } else {
        await createBanner({
          ...formData,
          banner_image: bannerFile as File,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
        }).unwrap();
        toast.success("Banner created successfully!");
      }
      navigate("/vendor/banners");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.data?.message || "Operation failed.");
    }
  };

  const selectedStoreName =
    activeStores.find((s) => s._id === formData.store_id)?.store_name ||
    "Selected Store";

  if (isFetchingBanner) {
    return (
      <FullScreenLoader
        title="Loading Banners"
        subtitle="Retrieving banner details..."
      />
    );
  }

  if (isEditMode && isBannerFetchError) {
    return (
      <div className="text-center py-5">
        <p className="text-danger fw-semibold">
          Failed to load banner details.
        </p>
        <button
          className="banner-back-btn"
          onClick={() => navigate("/vendor/banners")}
        >
          Back to Banners
        </button>
      </div>
    );
  }

  return (
    <div className="banner-create-wrapper">
      {/* Top Action Bar */}
      <div className="banner-top-bar">
        <div>
          <h1 className="banner-top-title">
            {isEditMode ? "Edit Campaign Banner" : "New Campaign Banner"}
          </h1>
          <p className="banner-top-subtitle">
            Configure visual assets, targets, placements, and promotional dates.
          </p>
        </div>
        <button
          type="button"
          className="banner-back-btn"
          onClick={() => navigate("/vendor/banners")}
        >
          <MdArrowBack size={18} /> Back to Banners
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="banner-grid-layout">
          {/* LEFT COLUMN: Main Form Inputs */}
          <div className="banner-main-col">
            {/* 1. Visual Creative */}
            <div className="banner-card">
              <div className="banner-card-head">
                <div className="banner-card-icon">
                  <MdImage />
                </div>
                <div>
                  <h3 className="banner-card-title">Banner Creative</h3>
                  <p className="banner-card-desc">
                    High-resolution imagery displayed across user touchpoints.
                  </p>
                </div>
              </div>

              {imagePreview ? (
                <div className="banner-uploaded-view">
                  <img src={imagePreview} alt="Banner Preview" />
                  <div className="banner-uploaded-actions">
                    <button
                      type="button"
                      className="banner-icon-action-btn"
                      onClick={handleRemoveImage}
                      title="Replace Image"
                    >
                      <MdDeleteOutline size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`banner-upload-box ${
                    isDragOver ? "banner-upload-box--active" : ""
                  } ${errors.banner_image ? "banner-upload-box--error" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="banner-upload-ring">
                    <MdCloudUpload size={28} />
                  </div>
                  <p className="banner-upload-title">
                    Drop your banner here, or <span>Browse files</span>
                  </p>
                  <p className="banner-upload-subtitle">
                    Recommended 1200 × 500 px · PNG, JPG, or WEBP up to 5MB
                  </p>
                  <span className="banner-upload-badge">
                    Drag & Drop Active
                  </span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
              {errors.banner_image && (
                <div className="banner-error-msg">{errors.banner_image}</div>
              )}
            </div>

            {/* 2. Platform & Store Attribution */}
            <div className="banner-card">
              <div className="banner-card-head">
                <div className="banner-card-icon">
                  <MdStorefront />
                </div>
                <div>
                  <h3 className="banner-card-title">Platform & Store</h3>
                  <p className="banner-card-desc">
                    Where and on which store this promotional banner appears.
                  </p>
                </div>
              </div>

              <label className="banner-label">
                Upload Area (Platform){" "}
                <span className="banner-label-req">*</span>
              </label>
              <div className="banner-platform-cards">
                <div
                  className={`banner-platform-card ${
                    formData.upload_area === "app"
                      ? "banner-platform-card--active"
                      : ""
                  }`}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, upload_area: "app" }))
                  }
                >
                  <div className="banner-platform-card-icon">
                    <MdSmartphone />
                  </div>
                  <div>
                    <h4 className="banner-platform-card-label">Mobile App</h4>
                    <p className="banner-platform-card-sub">
                      iOS & Android Feed
                    </p>
                  </div>
                </div>

                <div
                  className={`banner-platform-card ${
                    formData.upload_area === "website"
                      ? "banner-platform-card--active"
                      : ""
                  }`}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, upload_area: "website" }))
                  }
                >
                  <div className="banner-platform-card-icon">
                    <MdLanguage />
                  </div>
                  <div>
                    <h4 className="banner-platform-card-label">Website</h4>
                    <p className="banner-platform-card-sub">
                      Desktop & Mobile Web
                    </p>
                  </div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6 banner-input-group">
                  <label className="banner-label">
                    Target Store <span className="banner-label-req">*</span>
                  </label>
                  <div className="banner-input-wrap">
                    <span className="banner-input-icon">
                      <MdStorefront size={18} />
                    </span>
                    <select
                      name="store_id"
                      className={`banner-field ${
                        errors.store_id ? "banner-field--error" : ""
                      }`}
                      value={formData.store_id}
                      onChange={handleInputChange}
                    >
                      <option value="">Choose Store</option>
                      {activeStores.map((store) => (
                        <option key={store._id} value={store._id}>
                          {store.store_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.store_id && (
                    <div className="banner-error-msg">{errors.store_id}</div>
                  )}
                </div>

                <div className="col-md-6 banner-input-group">
                  <label className="banner-label">
                    Banner Title <span className="banner-label-req">*</span>
                  </label>
                  <div className="banner-input-wrap">
                    <span className="banner-input-icon">
                      <MdTitle size={18} />
                    </span>
                    <input
                      type="text"
                      name="title"
                      className={`banner-field ${
                        errors.title ? "banner-field--error" : ""
                      }`}
                      placeholder="e.g. Flash 50% Off Electronics"
                      value={formData.title}
                      onChange={handleInputChange}
                    />
                  </div>
                  {errors.title && (
                    <div className="banner-error-msg">{errors.title}</div>
                  )}
                </div>

                <div className="col-12 banner-input-group mb-0">
                  <label className="banner-label">Description (Optional)</label>
                  <textarea
                    name="description"
                    className="banner-field banner-field--noicon"
                    placeholder="Briefly describe what this promotional banner communicates..."
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* 3. Placements & Links */}
            <div className="banner-card">
              <div className="banner-card-head">
                <div className="banner-card-icon">
                  <MdLayers />
                </div>
                <div>
                  <h3 className="banner-card-title">Placement & Navigation</h3>
                  <p className="banner-card-desc">
                    Control screen layout position and user redirect routing.
                  </p>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-4 banner-input-group">
                  <label className="banner-label">Position Placement</label>
                  <select
                    name="position"
                    className="banner-field banner-field--noicon"
                    value={formData.position}
                    onChange={handleInputChange}
                  >
                    <option value="home_top">Top of Home</option>
                    <option value="home_middle">Middle of Home</option>
                    <option value="home_bottom">Bottom of Home</option>
                    <option value="category">Category Page</option>
                    <option value="product">Product Page</option>
                    <option value="promotional">Promotional</option>
                  </select>
                </div>

                <div className="col-md-4 banner-input-group">
                  <label className="banner-label">Device Type</label>
                  <select
                    name="device_type"
                    className="banner-field banner-field--noicon"
                    value={formData.device_type}
                    onChange={handleInputChange}
                  >
                    <option value="all">All Devices</option>
                    <option value="mobile">Mobile Devices</option>
                    <option value="desktop">Desktop Computers</option>
                    <option value="tablet">Tablets</option>
                  </select>
                </div>

                <div className="col-md-4 banner-input-group">
                  <label className="banner-label">Sort Priority</label>
                  <div className="banner-input-wrap">
                    <span className="banner-input-icon">
                      <MdSort size={18} />
                    </span>
                    <input
                      type="number"
                      name="sort_order"
                      min={0}
                      className="banner-field"
                      value={formData.sort_order}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="col-md-5 banner-input-group">
                  <label className="banner-label">Redirect Type</label>
                  <select
                    name="redirect_type"
                    className="banner-field banner-field--noicon"
                    value={formData.redirect_type}
                    onChange={handleInputChange}
                  >
                    <option value="none">None (Display Only)</option>
                    <option value="internal">Internal Route</option>
                    <option value="external">External Link</option>
                  </select>
                </div>

                <div className="col-md-7 banner-input-group">
                  <label className="banner-label">
                    Destination URL / Path{" "}
                    {formData.redirect_type !== "none" && (
                      <span className="banner-label-req">*</span>
                    )}
                  </label>
                  <div className="banner-input-wrap">
                    <span className="banner-input-icon">
                      <MdLink size={18} />
                    </span>
                    <input
                      type="text"
                      name="redirect_url"
                      className={`banner-field ${
                        errors.redirect_url ? "banner-field--error" : ""
                      }`}
                      placeholder={
                        formData.redirect_type === "internal"
                          ? "/products/category/smartphones"
                          : "https://mysite.com/special-offer"
                      }
                      value={formData.redirect_url}
                      onChange={handleInputChange}
                      disabled={formData.redirect_type === "none"}
                    />
                  </div>
                  {errors.redirect_url && (
                    <div className="banner-error-msg">
                      {errors.redirect_url}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Campaign Duration with Custom DatePickerInput */}
            <div className="banner-card mb-0">
              <div className="banner-card-head">
                <div className="banner-card-icon">
                  <MdDateRange />
                </div>
                <div>
                  <h3 className="banner-card-title">Schedule & Visibility</h3>
                  <p className="banner-card-desc">
                    Set optional automated start and expire dates.
                  </p>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6 banner-input-group mb-md-0">
                  <label className="banner-label">Start Date</label>
                  <DatePickerInput
                    value={formData.start_date}
                    onChange={(val) => handleDateChange("start_date", val)}
                    placeholder="Pick start date"
                    hasError={Boolean(errors.start_date)}
                  />
                  {errors.start_date && (
                    <div className="banner-error-msg">{errors.start_date}</div>
                  )}
                </div>

                <div className="col-md-6 banner-input-group mb-0">
                  <label className="banner-label">End Date</label>
                  <DatePickerInput
                    value={formData.end_date}
                    onChange={(val) => handleDateChange("end_date", val)}
                    placeholder="Pick expiry date"
                    hasError={Boolean(errors.end_date)}
                    minDate={formData.start_date}
                  />
                  {errors.end_date && (
                    <div className="banner-error-msg">{errors.end_date}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Sticky Preview & Actions */}
          <div className="banner-preview-pane">
            <div className="banner-mockup-card">
              <div className="banner-mockup-header">
                <span
                  className="fw-bold text-dark"
                  style={{ fontSize: "0.85rem" }}
                >
                  Live Preview
                </span>
                <span className="banner-mockup-tag">
                  {formData.upload_area === "app"
                    ? "📱 Mobile Feed"
                    : "🌐 Web Banner"}
                </span>
              </div>

              {/* Realistic Screen Mockup */}
              <div className="banner-screen-shell">
                <div className="banner-screen-bar">
                  <span className="banner-screen-dot"></span>
                  <span className="banner-screen-dot"></span>
                  <span className="banner-screen-dot"></span>
                </div>
                <div className="banner-mockup-img-wrap">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="banner-mockup-img"
                    />
                  ) : (
                    <div className="banner-mockup-placeholder">
                      <MdImage size={30} />
                      <span>Upload an image</span>
                    </div>
                  )}

                  {formData.title && (
                    <div className="banner-mockup-overlay-text">
                      <h5 className="banner-mockup-title">{formData.title}</h5>
                      {formData.redirect_url && (
                        <span className="banner-mockup-link">
                          <MdOpenInNew size={11} /> {formData.redirect_url}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Metadata List */}
              <div className="banner-mockup-specs">
                <div className="banner-spec-row">
                  <span className="banner-spec-label">Store:</span>
                  <span className="banner-spec-val" title={selectedStoreName}>
                    {selectedStoreName}
                  </span>
                </div>
                <div className="banner-spec-row">
                  <span className="banner-spec-label">Position:</span>
                  <span className="banner-spec-val">
                    {POSITION_LABELS[formData.position]}
                  </span>
                </div>
                <div className="banner-spec-row">
                  <span className="banner-spec-label">Device Target:</span>
                  <span className="banner-spec-val text-capitalize">
                    {formData.device_type}
                  </span>
                </div>
                <div className="banner-spec-row">
                  <span className="banner-spec-label">Redirect:</span>
                  <span className="banner-spec-val text-capitalize">
                    {formData.redirect_type}
                  </span>
                </div>
                {formData.start_date && (
                  <div className="banner-spec-row mb-0">
                    <span className="banner-spec-label">Validity:</span>
                    <span className="banner-spec-val">
                      {formData.start_date}
                      {formData.end_date ? ` → ${formData.end_date}` : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Buttons (Nested cleanly inside the card) */}
              <div className="banner-form-footer">
                <button
                  type="button"
                  className="banner-back-btn"
                  onClick={() => navigate("/vendor/banners")}
                  disabled={isCreating || isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="banner-save-btn"
                  disabled={isCreating || isUpdating}
                >
                  {isCreating || isUpdating ? (
                    <>
                      <div className="spinner"></div> Saving...
                    </>
                  ) : (
                    <>
                      <MdSave size={16} />{" "}
                      {isEditMode ? "Save Changes" : "Publish Banner"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateBanner;
