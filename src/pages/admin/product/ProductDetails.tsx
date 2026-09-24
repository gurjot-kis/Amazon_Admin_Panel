// import { useState } from "react";
// import { useNavigate, useParams, Link } from "react-router-dom";
// import { useGetProductByIdQuery } from "../../../features/product/productApi";
// import "../../../styles/product/ProductDetails.css";
// import { FullScreenLoader } from "../../../components/common/FullScreenLoader";

// // ── Icons ────────────────────────────────────────────────────────────────────
// const Icon = {
//   Back: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//       <path
//         d="M19 12H5M12 19l-7-7 7-7"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//       />
//     </svg>
//   ),
//   Edit: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//       <path
//         d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//       />
//       <path
//         d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//       />
//     </svg>
//   ),
//   Clock: () => (
//     <svg
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="1.8"
//     >
//       <circle cx="12" cy="12" r="10" />
//       <polyline
//         points="12 6 12 12 16 14"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//       />
//     </svg>
//   ),
//   Star: () => (
//     <svg viewBox="0 0 24 24" fill="currentColor">
//       <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
//     </svg>
//   ),
//   Check: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//       <polyline
//         points="20 6 9 17 4 12"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//       />
//     </svg>
//   ),
//   Tag: () => (
//     <svg
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="1.8"
//     >
//       <path
//         d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
//         strokeLinejoin="round"
//       />
//       <line x1="7" y1="7" x2="7.01" y2="7" strokeLinecap="round" />
//     </svg>
//   ),
//   Layers: () => (
//     <svg
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="1.8"
//     >
//       <polygon points="12 2 2 7 12 12 22 7 12 2" />
//       <polyline points="2 17 12 22 22 17" />
//       <polyline points="2 12 12 17 22 12" />
//     </svg>
//   ),
//   Spinner: () => (
//     <svg viewBox="0 0 24 24" fill="none" className="pdp-spin">
//       <circle
//         cx="12"
//         cy="12"
//         r="9"
//         stroke="currentColor"
//         strokeWidth="2.5"
//         strokeLinecap="round"
//         strokeDasharray="42 100"
//       />
//     </svg>
//   ),
// };

// export default function ProductDetails() {
//   const { productId } = useParams<{ productId: string }>();
//   const navigate = useNavigate();
//   const API_ASSET_URL = import.meta.env.VITE_API_ASSET_URL || "";

//   const {
//     data: productResponse,
//     isLoading,
//     isError,
//   } = useGetProductByIdQuery(productId as string, { skip: !productId });

//   const product = productResponse?.data;

//   const getAssetUrl = (path?: string | null) => {
//     if (!path) return "";
//     if (path.startsWith("http://") || path.startsWith("https://")) return path;
//     return `${API_ASSET_URL}${path.startsWith("/") ? "" : "/"}${path}`;
//   };

//   // Gallery state
//   const [selectedImage, setSelectedImage] = useState<string | null>(null);
//   const [selectedVariantKey, setSelectedVariantKey] = useState<string | null>(
//     null,
//   );

//   if (isLoading) {
//     return (
//       <FullScreenLoader
//         title="Loading Product Details"
//         subtitle="Getting things ready for you!"
//       />
//     );
//   }

//   if (isError || !product) {
//     return (
//       <div className="pdp-loader-screen">
//         <h3>Product Not Found</h3>
//         <p>The requested catalog item could not be retrieved.</p>
//         <button
//           onClick={() => navigate(-1)}
//           className="pdp-btn pdp-btn--secondary"
//         >
//           <Icon.Back /> Return to Catalog
//         </button>
//       </div>
//     );
//   }

//   // Aggregate all gallery images
//   const allImages = [
//     getAssetUrl(product.mainImage),
//     ...(product.images || []).map((img: string) => getAssetUrl(img)),
//   ].filter(Boolean);

//   const activeImage = selectedImage || allImages[0] || "";
//   const selectedVariant =
//     product.variants?.find(
//       (v: { key: string }) => v.key === selectedVariantKey,
//     ) || product.variants?.[0];

//   const activePrice = selectedVariant
//     ? selectedVariant.price
//     : product.basePrice;

//   return (
//     <div className="pdp-wrapper">
//       {/* ── Top Bar / Breadcrumb ────────────────────────────────────── */}
//       <header className="pdp-navbar">
//         <div className="pdp-nav-left">
//           <button
//             onClick={() => navigate(-1)}
//             className="pdp-back-btn"
//             aria-label="Go back"
//           >
//             <Icon.Back />
//           </button>
//           <nav className="pdp-breadcrumbs">
//             <span>Catalog</span>
//             <span className="pdp-sep">/</span>
//             <span>{product.category_name || "Category"}</span>
//             {product.sub_category_name && (
//               <>
//                 <span className="pdp-sep">/</span>
//                 <span>{product.sub_category_name}</span>
//               </>
//             )}
//           </nav>
//         </div>
//         <div className="pdp-nav-right">
//           <span
//             className={`pdp-status-badge pdp-status-badge--${product.status}`}
//           >
//             {product.status}
//           </span>
//           <Link
//             to={`/admin/products/${product._id}/edit`}
//             className="pdp-btn pdp-btn--primary"
//           >
//             <Icon.Edit /> Edit Product
//           </Link>
//         </div>
//       </header>

//       {/* ── Main Layout ────────────────────────────────────────────── */}
//       <div className="pdp-grid">
//         {/* ── Left Column: Media Gallery ── */}
//         <section className="pdp-gallery-card">
//           <div className="pdp-main-stage">
//             <img
//               src={activeImage}
//               alt={product.name}
//               className="pdp-main-img"
//             />
//           </div>
//           {allImages.length > 1 && (
//             <div className="pdp-thumbnail-strip">
//               {allImages.map((img, idx) => (
//                 <button
//                   key={idx}
//                   onClick={() => setSelectedImage(img)}
//                   className={`pdp-thumb-btn ${activeImage === img ? "pdp-thumb-btn--active" : ""}`}
//                 >
//                   <img src={img} alt={`View ${idx + 1}`} />
//                 </button>
//               ))}
//             </div>
//           )}
//         </section>

//         {/* ── Right Column: Product Info & Actions ── */}
//         <section className="pdp-info-card">
//           <div className="pdp-meta-row">
//             <span className="pdp-sku">SLUG: {product.slug}</span>
//             {product.rating && (
//               <div className="pdp-rating-pill">
//                 <Icon.Star />
//                 <span className="pdp-rating-score">
//                   {product.rating.average}
//                 </span>
//                 <span className="pdp-rating-count">
//                   ({product.rating.count})
//                 </span>
//               </div>
//             )}
//           </div>

//           <h1 className="pdp-title">{product.name}</h1>
//           <p className="pdp-short-desc">{product.shortDescription}</p>

//           <div className="pdp-price-box">
//             <div className="pdp-price-main">
//               <span className="pdp-currency">₹</span>
//               <span className="pdp-amount">
//                 {activePrice?.toLocaleString()}
//               </span>
//             </div>
//             {selectedVariant && selectedVariant.costPrice && (
//               <span className="pdp-cost-price">
//                 Cost: ₹{selectedVariant.costPrice}
//               </span>
//             )}
//           </div>

//           {/* Variants Selector */}
//           {product.variants && product.variants.length > 0 && (
//             <div className="pdp-variants-container">
//               <label className="pdp-section-label">
//                 {product.variantLabel || "Select Option"}
//               </label>
//               <div className="pdp-variant-chips">
//                 {product.variants.map((variant) => {
//                   const isSelected =
//                     (selectedVariantKey || product.variants[0].key) ===
//                     variant.key;
//                   return (
//                     <button
//                       key={variant.key}
//                       onClick={() => {
//                         setSelectedVariantKey(variant.key);
//                         if (variant.image)
//                           setSelectedImage(getAssetUrl(variant.image));
//                       }}
//                       className={`pdp-variant-chip ${isSelected ? "pdp-variant-chip--active" : ""}`}
//                     >
//                       {variant.image && (
//                         <img
//                           src={getAssetUrl(variant.image)}
//                           alt={variant.label}
//                           className="pdp-chip-thumb"
//                         />
//                       )}
//                       <span className="pdp-chip-label">{variant.label}</span>
//                       <span className="pdp-chip-price">₹{variant.price}</span>
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           )}

//           {/* Quick Specs Highlight */}
//           <div className="pdp-specs-strip">
//             <div className="pdp-spec-node">
//               <Icon.Clock />
//               <div>
//                 <small>Duration</small>
//                 <strong>
//                   {product.durationMinutes
//                     ? `${product.durationMinutes} mins`
//                     : "Instant"}
//                 </strong>
//               </div>
//             </div>
//             <div className="pdp-spec-node">
//               <Icon.Layers />
//               <div>
//                 <small>Max Quantity</small>
//                 <strong>{product.maxQuantity || "Unlimited"}</strong>
//               </div>
//             </div>
//             <div className="pdp-spec-node">
//               <Icon.Tag />
//               <div>
//                 <small>Base Price</small>
//                 <strong>₹{product.basePrice}</strong>
//               </div>
//             </div>
//           </div>

//           {/* What's Included */}
//           {product.includes && product.includes.length > 0 && (
//             <div className="pdp-includes-section">
//               <label className="pdp-section-label">Package Inclusions</label>
//               <div className="pdp-includes-grid">
//                 {product.includes.map((inc: string, i: number) => (
//                   <div key={i} className="pdp-include-pill">
//                     <Icon.Check />
//                     <span>{inc}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Description Body */}
//           <div className="pdp-description-section">
//             <label className="pdp-section-label">Detailed Information</label>
//             <div className="pdp-description-body">
//               <p>{product.description}</p>
//             </div>
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// }

import React from 'react'

const ProductDetails = () => {
  return (
    <div>ProductDetails</div>
  )
}

export default ProductDetails