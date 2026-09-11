import React, { useState } from "react";

// Reusable Image or Fallback Icon component
const CategoryThumb: React.FC<{
  src?: string;
  alt: string;
  className?: string;
  iconClassName?: string;
}> = ({ src, alt, className, iconClassName }) => {
  const [hasError, setHasError] = useState(false);

  // If no source provided or failed to load, show gallery icon
  if (!src || hasError) {
    return (
      <div className={`as-fallback-icon-wrap ${className ?? ""}`}>
        {/* Gallery / Image SVG Icon */}
        <svg
          className={`as-fallback-svg ${iconClassName ?? ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};

export default CategoryThumb;
