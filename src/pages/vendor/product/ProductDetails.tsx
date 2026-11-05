import React, { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";
import {
  useGetProductByIdQuery,
  useUpdateProductStatusMutation,
} from "../../../features/product/productApi";
import "../../../styles/product/ProductDetails.css";
import { FullScreenLoader } from "../../../components/common/FullScreenLoader";

const ASSET_BASE_URL = (import.meta.env.VITE_API_ASSET_URL || "").replace(
  /\/$/,
  "",
);

export const resolveImageUrl = (path?: string | null): string => {
  if (!path) return "https://placehold.co/600x450?text=No+Image";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${ASSET_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

const getErrorMessage = (
  err: FetchBaseQueryError | SerializedError | undefined,
): string => {
  if (!err) return "An unexpected error occurred.";
  if ("data" in err && typeof err.data === "object" && err.data !== null) {
    return (
      (err.data as { message?: string }).message ||
      "Failed to load product details."
    );
  }
  if ("message" in err && typeof err.message === "string") {
    return err.message;
  }
  return "The requested product could not be found or an error occurred.";
};

interface GalleryAsset {
  url: string;
  source: "main" | "featured" | "variant";
  label?: string;
  variantId?: string;
}

const ProductDetails: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetProductByIdQuery(productId || "");
  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateProductStatusMutation();

  const product = response?.data;

  // FIX: Default selectedVariantId to the first variant's _id (not "all")
  // This ensures variant images + sidebar stats reflect the first variant on load.
  const defaultVariantId = useMemo(() => {
    if (
      product?.hasVariants &&
      Array.isArray(product.variants) &&
      product.variants.length > 0
    ) {
      return product.variants[0]._id;
    }
    return "all";
  }, [product]);

  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | "all">(
    "all",
  );

  // Sync selectedVariantId to defaultVariantId once product loads
  // We use a ref-flag so this only runs once on first load.
  const [initialized, setInitialized] = useState(false);
  useMemo(() => {
    if (product && !initialized) {
      setSelectedVariantId(defaultVariantId);
      setInitialized(true);
      // Pre-set active image to first image of the first variant
      if (defaultVariantId !== "all" && Array.isArray(product.variants)) {
        const firstVariant = product.variants[0];
        if (firstVariant?.images?.length > 0) {
          setActiveImage(firstVariant.images[0]);
        }
      }
    }
  }, [product, initialized, defaultVariantId]);

  // 1. Collect all variant images across all variants
  const variantMediaAssets = useMemo<GalleryAsset[]>(() => {
    if (!product || !product.hasVariants || !Array.isArray(product.variants)) {
      return [];
    }

    const assets: GalleryAsset[] = [];
    const seen = new Set<string>();

    product.variants.forEach((v) => {
      const comboLabel = v.combination
        ?.map((c) => c.variant_option_id?.value)
        .filter(Boolean)
        .join(" / ");

      if (Array.isArray(v.images) && v.images.length > 0) {
        v.images.forEach((vImg, idx) => {
          if (vImg && !seen.has(vImg)) {
            seen.add(vImg);
            assets.push({
              url: vImg,
              source: "variant",
              label: comboLabel
                ? `${comboLabel} #${idx + 1}`
                : `Variant #${idx + 1}`,
              variantId: v._id,
            });
          }
        });
      }
    });

    return assets;
  }, [product]);

  // 2. FIX: For non-variant products, show ONLY featuredImages (not mainImage).
  // mainImage is excluded because it is designed as the mobile fallback thumbnail.
  const baseMediaAssets = useMemo<GalleryAsset[]>(() => {
    if (!product) return [];
    const assets: GalleryAsset[] = [];
    const seen = new Set<string>();

    // mainImage intentionally excluded here — only featuredImages shown in gallery
    if (Array.isArray(product.featuredImages)) {
      product.featuredImages.forEach((img, idx) => {
        if (img && !seen.has(img)) {
          seen.add(img);
          assets.push({
            url: img,
            source: "featured",
            label: `Featured #${idx + 1}`,
          });
        }
      });
    }

    return assets;
  }, [product]);

  // 3. Conditional Rule:
  // If variant images exist -> show variant images ONLY
  // If no variant images -> show featuredImages only (mainImage excluded)
  const allMediaAssets = useMemo<GalleryAsset[]>(() => {
    if (variantMediaAssets.length > 0) {
      return variantMediaAssets;
    }
    return baseMediaAssets;
  }, [variantMediaAssets, baseMediaAssets]);

  // 4. Handle variant filtering when a variant row is clicked
  const displayedGallery = useMemo(() => {
    if (selectedVariantId === "all") return allMediaAssets;
    const filtered = allMediaAssets.filter(
      (asset) => asset.variantId === selectedVariantId,
    );
    return filtered.length > 0 ? filtered : allMediaAssets;
  }, [allMediaAssets, selectedVariantId]);

  // 5. Active Previewed Image
  const currentImage = useMemo(() => {
    if (
      activeImage &&
      displayedGallery.some((item) => item.url === activeImage)
    ) {
      return activeImage;
    }
    return displayedGallery[0]?.url || "";
  }, [activeImage, displayedGallery]);

  // FIX: Derive the currently selected variant object so sidebar can reflect
  // its price/stock instead of always showing product-level values.
  const selectedVariant = useMemo(() => {
    if (!product?.hasVariants || !Array.isArray(product.variants)) return null;
    if (selectedVariantId === "all") return null;
    return product.variants.find((v) => v._id === selectedVariantId) || null;
  }, [product, selectedVariantId]);

  // Aggregate stock across variants if present
  const totalStock = useMemo(() => {
    if (!product) return 0;
    if (product.hasVariants && product.variants?.length) {
      return product.variants.reduce((acc, curr) => acc + (curr.stock || 0), 0);
    }
    return product.stock || 0;
  }, [product]);

  const formatCurrency = (val: number = 0, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  const calculateMargin = (cost: number = 0, selling: number = 0) => {
    if (!cost || !selling || selling <= 0) return 0;
    return (((selling - cost) / selling) * 100).toFixed(1);
  };

  const calculateDiscount = (mrp: number = 0, selling: number = 0) => {
    if (!mrp || mrp <= selling) return 0;
    return Math.round(((mrp - selling) / mrp) * 100);
  };

  const handleStatusToggle = async () => {
    if (!product) return;
    const nextStatus = product.status === "active" ? "inactive" : "active";
    try {
      await updateStatus({
        productId: product._id,
        status: nextStatus,
      }).unwrap();
    } catch (err) {
      console.error("Failed to change product status:", err);
    }
  };

  const handleVariantSelect = (variantId: string) => {
    const isClearing = selectedVariantId === variantId;
    const nextId = isClearing ? "all" : variantId;
    setSelectedVariantId(nextId);

    if (!isClearing) {
      const firstTargetImg = allMediaAssets.find(
        (asset) => asset.variantId === variantId,
      );
      if (firstTargetImg) {
        setActiveImage(firstTargetImg.url);
      }
    } else {
      // Cleared: reset to first image of full gallery
      setActiveImage(allMediaAssets[0]?.url || null);
    }
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    e.currentTarget.src =
      "https://placehold.co/600x450?text=Preview+Unavailable";
  };

  if (isLoading) {
    return (
      <FullScreenLoader
        title="Loading Product Details"
        subtitle="Getting things ready for you!"
      />
    );
  }

  if (isError || !product) {
    return (
      <div className="pro-detail-center-screen">
        <div className="pro-detail-alert-box">
          <div className="pro-detail-alert-icon">✦</div>
          <h2 className="pro-detail-alert-title">Unable to Retrieve Record</h2>
          <p className="pro-detail-alert-desc">{getErrorMessage(error)}</p>
          <div className="pro-detail-alert-btns">
            <button
              className="pro-detail-btn pro-detail-btn-ghost"
              onClick={() => navigate(-1)}
            >
              Return to Catalog
            </button>
            <button
              className="pro-detail-btn pro-detail-btn-solid"
              onClick={() => refetch()}
            >
              Retry Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FIX: Sidebar pricing and stock — use selected variant values when a variant
  // is active, otherwise fall back to product-level values.
  const displaySellingPrice =
    selectedVariant?.sellingPrice ?? product.sellingPrice;
  const displayCostPrice = selectedVariant?.costPrice ?? product.costPrice;
  const displayMrp = selectedVariant?.price ?? product.price;
  const displayStock =
    selectedVariant?.stock ??
    (product.hasVariants ? totalStock : product.stock);
  const displayStockStatus =
    selectedVariant?.stockStatus ?? product.stockStatus;

  return (
    <div className="pro-detail-canvas">
      {/* Top Banner Navigation */}
      <header className="pro-detail-top-nav">
        <div className="pro-detail-nav-left">
          <div className="pro-detail-breadcrumbs">
            <Link to="/admin" className="pro-detail-breadcrumb-item">
              Dashboard
            </Link>
            <span className="pro-detail-breadcrumb-sep">/</span>
            <Link to="/vendor/products" className="pro-detail-breadcrumb-item">
              Products
            </Link>
            <span className="pro-detail-breadcrumb-sep">/</span>
            <span className="pro-detail-breadcrumb-active">{product.name}</span>
          </div>

          <div className="pro-detail-title-cluster">
            <h1 className="pro-detail-product-name">{product.name}</h1>
            <span
              className={`pro-detail-status-pill pro-detail-pill-${product.status}`}
            >
              <span className="pro-detail-status-dot"></span>
              {product.status}
            </span>
            <span
              className={`pro-detail-stock-chip pro-detail-stock-${product.stockStatus}`}
            >
              {product.stockStatus.replace("_", " ")}
            </span>
          </div>

          <div className="pro-detail-quick-meta">
            <span className="pro-detail-meta-tag">
              SKU: <strong>{product.sku || "N/A"}</strong>
            </span>
            {product.unit && (
              <span className="pro-detail-meta-tag">
                Unit:{" "}
                <span className="pro-detail-unit-badge">{product.unit}</span>
              </span>
            )}
            <span className="pro-detail-meta-tag">
              Slug: <code>{product.slug}</code>
            </span>
            <span className="pro-detail-meta-tag">
              ID: <code>{product._id}</code>
            </span>
          </div>
        </div>

        <div className="pro-detail-nav-right">
          <button
            type="button"
            className={`pro-detail-btn ${
              product.status === "active"
                ? "pro-detail-btn-outline-danger"
                : "pro-detail-btn-outline-success"
            }`}
            onClick={handleStatusToggle}
            disabled={isUpdatingStatus}
          >
            {isUpdatingStatus
              ? "Updating..."
              : product.status === "active"
                ? "Deactivate Product"
                : "Publish Product"}
          </button>
          <Link
            to={`/vendor/products/${product._id}/edit`}
            className="pro-detail-btn pro-detail-btn-solid"
          >
            Edit Record
          </Link>
        </div>
      </header>

      {/* Main Responsive Grid */}
      <main className="pro-detail-layout-grid">
        {/* Left Column: Visuals, Copy, and Variant Matrix */}
        <section className="pro-detail-primary-pane">
          {/* Media Showcase Card */}
          <div className="pro-detail-card pro-detail-media-showcase">
            <div className="pro-detail-stage-img-wrap">
              <img
                src={resolveImageUrl(currentImage)}
                alt={product.name}
                className="pro-detail-stage-img"
                onError={handleImageError}
              />
              <div className="pro-detail-stage-overlay">
                <span className="pro-detail-asset-count">
                  {displayedGallery.length}{" "}
                  {displayedGallery.length === 1 ? "Asset" : "Assets"}
                </span>
              </div>
            </div>

            {/* Gallery Thumbnail Strip */}
            {displayedGallery.length > 1 && (
              <div className="pro-detail-reel">
                {displayedGallery.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    title={item.label}
                    className={`pro-detail-reel-item ${
                      currentImage === item.url ? "is-selected" : ""
                    }`}
                    onClick={() => setActiveImage(item.url)}
                  >
                    <img
                      src={resolveImageUrl(item.url)}
                      alt={item.label || `Asset ${index + 1}`}
                      onError={handleImageError}
                    />
                    {item.source === "variant" && (
                      <span className="pro-detail-thumb-indicator">
                        Variant
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description & Narrative Card */}
          <div className="pro-detail-card">
            <div className="pro-detail-section-header">
              <h2 className="pro-detail-section-heading">
                Catalog Description
              </h2>
              <span className="pro-detail-field-badge">Public Facing</span>
            </div>

            {product.short_description && (
              <div className="pro-detail-highlight-desc">
                {product.short_description}
              </div>
            )}

            <div className="pro-detail-prose-body">
              {product.description ? (
                <p>{product.description}</p>
              ) : (
                <span className="pro-detail-empty-text">
                  No long description provided for this listing.
                </span>
              )}
            </div>
          </div>

          {/* Variants Matrix Card */}
          {product.hasVariants && (
            <div className="pro-detail-card">
              <div className="pro-detail-section-header">
                <div>
                  <h2 className="pro-detail-section-heading">Variant Matrix</h2>
                  <p className="pro-detail-section-sub">
                    Configured dimensions:{" "}
                    {product.variantTypes?.map((vt) => vt.name).join(" × ")}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  {selectedVariantId !== "all" && (
                    <button
                      type="button"
                      className="pro-detail-btn-reset-filter"
                      onClick={() => {
                        setSelectedVariantId("all");
                        setActiveImage(allMediaAssets[0]?.url || null);
                      }}
                    >
                      Clear Selection
                    </button>
                  )}
                  <span className="pro-detail-counter-pill">
                    {product.variants?.length || 0} Combinations
                  </span>
                </div>
              </div>

              <div className="pro-detail-table-scroller">
                <table className="pro-detail-matrix-table">
                  <thead>
                    <tr>
                      <th>Preview</th>
                      <th>Attributes</th>
                      <th>SKU</th>
                      <th>Cost</th>
                      <th>Selling Price</th>
                      <th>List Price</th>
                      <th>Gross Margin</th>
                      <th>Inventory</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants?.map((v) => {
                      const combinationTitle = v.combination
                        .map(
                          (c) =>
                            `${c.variant_type_id?.name}: ${c.variant_option_id?.value}`,
                        )
                        .join(" | ");
                      const margin = calculateMargin(
                        v.costPrice,
                        v.sellingPrice,
                      );
                      const isSelected = selectedVariantId === v._id;

                      return (
                        <tr
                          key={v._id}
                          className={isSelected ? "is-row-highlight" : ""}
                          onClick={() => handleVariantSelect(v._id)}
                        >
                          <td style={{ width: "70px" }}>
                            {v.images && v.images.length > 0 ? (
                              <div className="pro-detail-table-thumb-wrap">
                                <img
                                  src={resolveImageUrl(v.images[0])}
                                  alt="Variant"
                                  className="pro-detail-table-thumb"
                                  onError={handleImageError}
                                />
                                {v.images.length > 1 && (
                                  <span className="pro-detail-table-thumb-count">
                                    +{v.images.length - 1}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div
                                className="pro-detail-table-thumb-wrap pro-detail-placeholder-box"
                                title="No Image Available"
                              >
                                <svg
                                  className="pro-detail-gallery-svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect
                                    x="3"
                                    y="3"
                                    width="18"
                                    height="18"
                                    rx="3"
                                    ry="3"
                                  />
                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                  <polyline points="21 15 16 10 5 21" />
                                </svg>
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="pro-detail-combo-name">
                              {combinationTitle || "Default"}
                            </span>
                            <span className="pro-detail-combo-sub">
                              {v.stockStatus.replace("_", " ")}
                            </span>
                          </td>
                          <td>
                            <code className="pro-detail-code-badge">
                              {v.sku}
                            </code>
                          </td>
                          <td>
                            {formatCurrency(v.costPrice, product.currency)}
                          </td>
                          <td>
                            <strong className="pro-detail-price-main">
                              {formatCurrency(v.sellingPrice, product.currency)}
                            </strong>
                          </td>
                          <td>
                            <span className="pro-detail-strike-price">
                              {formatCurrency(v.price, product.currency)}
                            </span>
                          </td>
                          <td>
                            <span className="pro-detail-margin-chip">
                              {margin}%
                            </span>
                          </td>
                          <td>
                            <span
                              className={`pro-detail-qty-indicator ${
                                v.stock > 10
                                  ? "in-stock"
                                  : v.stock > 0
                                    ? "low-stock"
                                    : "out-of-stock"
                              }`}
                            >
                              {v.stock} units
                            </span>
                          </td>
                          <td>
                            <span
                              className={`pro-detail-status-pill pro-detail-pill-${v.status}`}
                            >
                              <span className="pro-detail-status-dot"></span>
                              {v.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Right Sidebar: Commercials, Categorization & System Traces */}
        <aside className="pro-detail-secondary-pane">
          {/* Store Identity Card */}
          {product.store_id && (
            <div className="pro-detail-card pro-detail-store-card">
              <span className="pro-detail-metric-caption">Sold By</span>
              <div className="pro-detail-store-identity">
                {product.store_id.store_logo && (
                  <img
                    src={resolveImageUrl(product.store_id.store_logo)}
                    alt={product.store_id.store_name}
                    className="pro-detail-store-logo"
                    onError={handleImageError}
                  />
                )}
                <div className="pro-detail-store-meta">
                  <span className="pro-detail-store-name">
                    {product.store_id.store_name}
                  </span>
                  <code className="pro-detail-sub-id">
                    {product.store_id._id}
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Revenue & Profitability Breakdown */}
          <div className="pro-detail-card pro-detail-finance-panel">
            <h2 className="pro-detail-section-heading">Financials & Pricing</h2>

            {/* FIX: Show selected variant label when a variant is active */}
            {selectedVariant && (
              <p
                className="pro-detail-section-sub"
                style={{ marginTop: "0.5rem" }}
              >
                Showing:{" "}
                {selectedVariant.combination
                  .map(
                    (c) =>
                      `${c.variant_type_id?.name}: ${c.variant_option_id?.value}`,
                  )
                  .join(" | ")}
              </p>
            )}

            <div className="pro-detail-price-lead-box">
              <span className="pro-detail-metric-caption">
                {selectedVariant
                  ? "Variant Selling Price"
                  : "Baseline Selling Price"}
              </span>
              <div className="pro-detail-lead-pricing">
                <span className="pro-detail-figure-main">
                  {formatCurrency(displaySellingPrice, product.currency)}
                </span>
                {displayMrp > displaySellingPrice && (
                  <span className="pro-detail-figure-discount">
                    -{calculateDiscount(displayMrp, displaySellingPrice)}%
                  </span>
                )}
              </div>
              <span className="pro-detail-figure-mrp">
                MRP: {formatCurrency(displayMrp, product.currency)}
              </span>
            </div>

            <div className="pro-detail-kpi-grid">
              <div className="pro-detail-kpi-box">
                <span className="pro-detail-kpi-label">Cost Price</span>
                <span className="pro-detail-kpi-val">
                  {formatCurrency(displayCostPrice, product.currency)}
                </span>
              </div>
              <div className="pro-detail-kpi-box">
                <span className="pro-detail-kpi-label">Gross Margin</span>
                <span className="pro-detail-kpi-val text-green">
                  {calculateMargin(displayCostPrice, displaySellingPrice)}%
                </span>
              </div>
            </div>

            <div className="pro-detail-summary-line">
              <span>Currency Used</span>
              <strong>{product.currency}</strong>
            </div>
          </div>

          {/* Logistics & Taxonomy Card */}
          <div className="pro-detail-card">
            <h2 className="pro-detail-section-heading">
              Categorization & Stock
            </h2>

            {product.category_id && (
              <div className="pro-detail-category-card">
                {product.category_id.category_image && (
                  <img
                    src={resolveImageUrl(product.category_id.category_image)}
                    alt={product.category_id.name}
                    className="pro-detail-category-thumb"
                    onError={handleImageError}
                  />
                )}
                <div>
                  <span className="pro-detail-metric-caption">
                    Primary Category
                  </span>
                  <div className="pro-detail-cat-name">
                    {product.category_id.name}
                  </div>
                  <code className="pro-detail-sub-id">
                    {product.category_id._id}
                  </code>
                </div>
              </div>
            )}

            <div className="pro-detail-inventory-metrics">
              {/* FIX: Stock reflects selected variant when active */}
              <div className="pro-detail-metric-row">
                <span className="pro-detail-metric-label">
                  {selectedVariant ? "Variant Stock" : "Aggregated Stock"}
                </span>
                <span className="pro-detail-metric-value">
                  {displayStock} units
                </span>
              </div>
              <div className="pro-detail-metric-row">
                <span className="pro-detail-metric-label">
                  Inventory Condition
                </span>
                <span className="pro-detail-metric-value capitalize">
                  {displayStockStatus.replace("_", " ")}
                </span>
              </div>
              <div className="pro-detail-metric-row">
                <span className="pro-detail-metric-label">
                  Variant Supported
                </span>
                <span className="pro-detail-metric-value">
                  {product.hasVariants ? "Yes (Multi-SKU)" : "Single SKU"}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Trail & Meta */}
          <div className="pro-detail-card">
            <h2 className="pro-detail-section-heading">System Audit Details</h2>
            <div className="pro-detail-audit-list">
              <div className="pro-detail-audit-row">
                <span>Created By</span>
                <strong>
                  {product.role} ({product.user_id.slice(-6)})
                </strong>
              </div>
              <div className="pro-detail-audit-row">
                <span>Created At</span>
                <strong>
                  {new Date(product.createdAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </strong>
              </div>
              <div className="pro-detail-audit-row">
                <span>Last Updated</span>
                <strong>
                  {new Date(product.updatedAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </strong>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default ProductDetails;
