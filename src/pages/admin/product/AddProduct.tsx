import React, { useEffect, useRef, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  MdDelete,
  MdSearch,
  MdKeyboardArrowDown,
  MdCheck,
  MdClose,
  MdCategory,
} from "react-icons/md";
import {
  Layers,
  Sparkles,
  UploadCloud,
  X,
  Plus,
  Trash2,
  DollarSign,
  Package,
  Eye,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Image as ImageIcon,
} from "lucide-react";

import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetProductByIdQuery,
} from "../../../features/product/productApi";
import { useGetLeafCategoriesQuery } from "../../../features/category/categoryApi";
import {
  useGetVariantTypesQuery,
  useGetVariantOptionsByTypeQuery,
} from "../../../features/variant/variantApi";
import type {
  CreateProductPayload,
  UpdateProductPayload,
  ProductVariantCombination,
} from "../../../features/product/productTypes";
import "../../../styles/product/AddProduct.css";
import { useHeader } from "../../../layout/LayoutContext";
import { FullScreenLoader } from "../../../components/common/FullScreenLoader";

const ASSET_BASE_URL = (import.meta.env.VITE_API_ASSET_URL || "").replace(
  /\/+$/,
  "",
);

export const getImageUrl = (path?: string | null): string => {
  if (!path) return "";
  if (
    path.startsWith("blob:") ||
    path.startsWith("data:") ||
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${ASSET_BASE_URL}${cleanPath}`;
};

const uid = () => Math.random().toString(36).slice(2, 9);
const MAX_IMAGE_MB = 5;
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"];

const validateImageFile = (file: File): string | null => {
  if (!file.type.startsWith("image/"))
    return "Only image files are supported (PNG, JPG, WEBP).";
  if (file.size > MAX_IMAGE_MB * 1024 * 1024)
    return `Image must be smaller than ${MAX_IMAGE_MB}MB.`;
  return null;
};

interface LeafCategory {
  _id: string;
  parent_id?: string;
  name: string;
}

interface VariantRow {
  _id?: string;
  id: string;
  combination: ProductVariantCombination[];
  sku: string;
  costPrice: string;
  sellingPrice: string;
  price: string;
  stock: string;
  images: (File | string)[];
  imagePreviews: string[];
}

interface FormState {
  name: string;
  description: string;
  short_description: string;
  category_id: string;
  sku: string;
  currency: string;
  costPrice: string;
  sellingPrice: string;
  price: string;
  stock: string;
  mainImage: File | string | null;
  featuredImages: (File | string)[];
  hasVariants: boolean;
  variantTypes: string[];
  variants: VariantRow[];
  status?: string;
}

const INITIAL: FormState = {
  name: "",
  description: "",
  short_description: "",
  category_id: "",
  sku: "",
  currency: "INR",
  costPrice: "",
  sellingPrice: "",
  price: "",
  stock: "",
  mainImage: null,
  featuredImages: [],
  hasVariants: false,
  variantTypes: [],
  variants: [],
};

const LeafCategoryDropdown = ({
  value,
  onChange,
  onBlur,
  error,
}: {
  value: string;
  onChange: (id: string) => void;
  onBlur: () => void;
  error?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  const {
    data: catResponse,
    isLoading,
    isFetching,
  } = useGetLeafCategoriesQuery({
    search: debouncedSearch,
  });

  const categories: LeafCategory[] = useMemo(() => {
    return Array.isArray(catResponse?.data) ? catResponse.data : [];
  }, [catResponse]);

  const selectedCategory = useMemo(() => {
    return categories.find((cat) => cat._id === value);
  }, [categories, value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        onBlur();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onBlur]);

  const handleOpen = () => {
    setIsOpen((prev) => {
      if (!prev) {
        setTimeout(() => searchInputRef.current?.focus(), 80);
      }
      return !prev;
    });
  };

  return (
    <div
      ref={containerRef}
      className={`cat-dd-wrapper ${isOpen ? "is-open" : ""} ${error ? "is-invalid" : ""}`}
    >
      <div
        className="cat-dd-trigger"
        onClick={handleOpen}
        role="button"
        tabIndex={0}
      >
        <span
          className={`cat-dd-trigger-text ${!value ? "is-placeholder" : ""}`}
        >
          {selectedCategory ? (
            <>
              <MdCategory
                size={18}
                color="#4f46e5"
                style={{ marginRight: "6px" }}
              />
              {selectedCategory.name}
            </>
          ) : value ? (
            "Category Selected"
          ) : (
            "Select leaf category..."
          )}
        </span>

        <div className="cat-dd-trigger-actions">
          {value && (
            <button
              type="button"
              className="cat-dd-clear-btn"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                setSearch("");
              }}
              title="Clear selection"
            >
              <MdClose size={13} />
            </button>
          )}
          <MdKeyboardArrowDown
            size={18}
            className={`cat-dd-chevron ${isOpen ? "rotate" : ""}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="cat-dd-panel">
          <div className="cat-dd-search-box">
            <MdSearch size={18} className="cat-dd-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="cat-dd-search-input"
              placeholder="Search category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {isFetching && <span className="cat-dd-loader" />}
          </div>

          <div className="cat-dd-list">
            {isLoading ? (
              <div className="cat-dd-state-msg">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="cat-dd-state-msg">No leaf categories match.</div>
            ) : (
              categories.map((cat) => {
                const isSelected = cat._id === value;
                return (
                  <div
                    key={cat._id}
                    className={`cat-dd-item ${isSelected ? "is-selected" : ""}`}
                    onClick={() => {
                      onChange(cat._id);
                      setIsOpen(false);
                      setSearch("");
                    }}
                  >
                    <span>{cat.name}</span>
                    {isSelected && (
                      <MdCheck size={16} className="cat-dd-check" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const VariantOptionSelect = ({ typeId, value, onChange }) => {
  const { data, isLoading } = useGetVariantOptionsByTypeQuery(
    { variantTypeId: typeId, status: "active" },
    { skip: !typeId },
  );

  const options = useMemo(() => {
    const raw = (data as any)?.data;
    if (Array.isArray(raw?.variantOptions)) return raw.variantOptions;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    return [];
  }, [data]);

  return (
    <div className="ap-select-box" style={{ minWidth: 140 }}>
      <select
        className="ap-select"
        style={{ height: 32, padding: "0 28px 0 10px", fontSize: "0.8rem" }}
        value={value} // ← always bind value, even while loading
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
      >
        {/* Only show placeholder when nothing is selected */}
        {!value && (
          <option value="">{isLoading ? "Loading..." : "Choose Option"}</option>
        )}
        {/* Always render a ghost option for the current value while loading */}
        {isLoading && value && <option value={value}>Loading...</option>}
        {options.map((o: any) => (
          <option key={o._id} value={o._id}>
            {o.label || o.value}
          </option>
        ))}
      </select>
      <ChevronDown className="ap-select-arrow" size={14} />
    </div>
  );
};

const ImageDropzone = ({
  label,
  preview,
  error,
  onFile,
  onRemove,
  hint,
}: {
  label: string;
  preview: string | null;
  error?: string | null;
  onFile: (f: File) => void;
  onRemove: () => void;
  hint?: string;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="ap-field">
      <label className="ap-label">{label}</label>
      <div
        className={`ap-dropzone ${dragging ? "is-dragging" : ""} ${error ? "is-invalid" : ""}`}
        onClick={() => !preview && ref.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        role="button"
        tabIndex={0}
      >
        {preview ? (
          <div className="ap-preview-wrapper">
            <img
              src={getImageUrl(preview)}
              alt="Upload preview"
              className="ap-preview-img"
            />
            <div className="ap-preview-overlay">
              <button
                type="button"
                className="ap-btn-remove-photo"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <Trash2 size={15} /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="ap-drop-icon">
              <UploadCloud size={22} />
            </div>
            <p className="ap-drop-title">Click or drag & drop to upload</p>
            <p className="ap-drop-subtitle">
              {hint ?? `PNG, JPG, WEBP · up to ${MAX_IMAGE_MB}MB`}
            </p>
          </div>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <p className="ap-error-msg">
          <AlertCircle size={13} /> {error}
        </p>
      )}
    </div>
  );
};

const AddProduct: React.FC = () => {
  const { id: paramId, productId: paramProductId } = useParams<{
    id?: string;
    productId?: string;
  }>();
  const activeProductId = paramProductId || paramId;
  const isEditMode = Boolean(activeProductId);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const [mainImageError, setMainImageError] = useState<string | null>(null);
  const [featuredPreviews, setFeaturedPreviews] = useState<string[]>([]);
  const featuredRef = useRef<HTMLInputElement>(null);

  const { setHeaderConfig } = useHeader();
  useEffect(() => {
    setHeaderConfig({ title: isEditMode ? "Edit Product" : "Add Product" });
  }, [setHeaderConfig, isEditMode]);

  const { data: productData, isLoading: isFetchingProduct } =
    useGetProductByIdQuery(activeProductId as string, {
      skip: !isEditMode || !activeProductId,
    });

  const { data: variantTypesData, isLoading: vtLoading } =
    useGetVariantTypesQuery({ limit: 100 }, { skip: !form.hasVariants });

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const isSubmitting = isCreating || isUpdating;

  const variantTypes = useMemo(
    () => variantTypesData?.data ?? [],
    [variantTypesData],
  );

  useEffect(() => {
    if (isEditMode && productData?.data) {
      const prod = productData.data;

      const populatedVariants: VariantRow[] = (prod.variants || []).map(
        (v) => ({
          _id: v._id,
          id: uid(),
          combination: (v.combination || []).map((c) => ({
            variant_type_id:
              typeof c.variant_type_id === "object"
                ? c.variant_type_id._id
                : c.variant_type_id,
            variant_option_id:
              typeof c.variant_option_id === "object"
                ? (c.variant_option_id as any)._id
                : c.variant_option_id,
          })),
          sku: v.sku || "",
          costPrice: v.costPrice !== undefined ? String(v.costPrice) : "",
          sellingPrice:
            v.sellingPrice !== undefined ? String(v.sellingPrice) : "",
          price: v.price !== undefined ? String(v.price) : "",
          stock: v.stock !== undefined ? String(v.stock) : "",
          images: v.images || [],
          imagePreviews: (v.images || []).map((img) => getImageUrl(img)),
        }),
      );

      const resolvedVariantTypes = (prod.variantTypes || []).map((vt) =>
        typeof vt === "object" ? vt._id : vt,
      );

      setForm({
        name: prod.name || "",
        description: prod.description || "",
        short_description: prod.short_description || "",
        category_id:
          typeof prod.category_id === "object"
            ? prod.category_id._id
            : prod.category_id,
        sku: prod.sku || "",
        currency: prod.currency || "INR",
        costPrice: prod.costPrice !== undefined ? String(prod.costPrice) : "",
        sellingPrice:
          prod.sellingPrice !== undefined ? String(prod.sellingPrice) : "",
        price: prod.price !== undefined ? String(prod.price) : "",
        stock: prod.stock !== undefined ? String(prod.stock) : "",
        mainImage: prod.mainImage || null,
        featuredImages: prod.featuredImages || [],
        hasVariants: prod.hasVariants || false,
        variantTypes: resolvedVariantTypes,
        variants: populatedVariants,
        status: prod.status ? prod.status : "Pending",
      });

      if (prod.mainImage) {
        setMainPreview(getImageUrl(prod.mainImage));
      }
      if (prod.featuredImages?.length) {
        setFeaturedPreviews(prod.featuredImages.map((img) => getImageUrl(img)));
      }
    }
  }, [isEditMode, productData]);

  useEffect(() => {
    setForm((p) => {
      if (!p.hasVariants || p.variantTypes.length === 0) {
        return { ...p, variants: [] };
      }

      const alreadySynced =
        p.variants.length > 0 &&
        p.variants.every((row) =>
          p.variantTypes.every((vtId) =>
            row.combination.some((c) => c.variant_type_id === vtId),
          ),
        );

      if (alreadySynced) return p;

      if (p.variants.length === 0) {
        return {
          ...p,
          variants: [
            {
              id: uid(),
              combination: p.variantTypes.map((vtId) => ({
                variant_type_id: vtId,
                variant_option_id: "",
              })),
              sku: "",
              costPrice: "",
              sellingPrice: "",
              price: "",
              stock: "",
              images: [],
              imagePreviews: [],
            },
          ],
        };
      }

      return {
        ...p,
        variants: p.variants.map((row) => ({
          ...row,
          combination: p.variantTypes.map((vtId) => ({
            variant_type_id: vtId,
            variant_option_id:
              row.combination.find((c) => c.variant_type_id === vtId)
                ?.variant_option_id ?? "",
          })),
        })),
      };
    });
  }, [form.hasVariants, form.variantTypes.join(",")]);

  const set = (field: keyof FormState, value: any) =>
    setForm((p) => ({ ...p, [field]: value }));

  const touch = (field: string) => setTouched((p) => ({ ...p, [field]: true }));

  const handleMainImage = (file: File) => {
    const err = validateImageFile(file);
    if (err) {
      setMainImageError(err);
      return;
    }
    setMainImageError(null);
    set("mainImage", file);
    setMainPreview(URL.createObjectURL(file));
  };

  const removeMainImage = () => {
    set("mainImage", null);
    setMainPreview(null);
    setMainImageError(null);
  };

  const handleFeaturedImages = (files: FileList) => {
    const valid: File[] = [];
    const previews: string[] = [];
    Array.from(files).forEach((f) => {
      if (!validateImageFile(f)) {
        valid.push(f);
        previews.push(URL.createObjectURL(f));
      }
    });
    setForm((p) => ({
      ...p,
      featuredImages: [...p.featuredImages, ...valid].slice(0, 6),
    }));
    setFeaturedPreviews((p) => [...p, ...previews].slice(0, 6));
  };

  const removeFeatured = (idx: number) => {
    setForm((p) => ({
      ...p,
      featuredImages: p.featuredImages.filter((_, i) => i !== idx),
    }));
    setFeaturedPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const addVariantRow = () => {
    setForm((p) => ({
      ...p,
      variants: [
        ...p.variants,
        {
          id: uid(),
          combination: form.variantTypes.map((vtId) => ({
            variant_type_id: vtId,
            variant_option_id: "",
          })),
          sku: "",
          costPrice: "",
          sellingPrice: "",
          price: "",
          stock: "",
          images: [],
          imagePreviews: [],
        },
      ],
    }));
  };

  const updateVariantRow = (
    rowId: string,
    field: keyof Omit<
      VariantRow,
      "id" | "combination" | "images" | "imagePreviews"
    >,
    value: string,
  ) => {
    setForm((p) => ({
      ...p,
      variants: p.variants.map((r) =>
        r.id === rowId ? { ...r, [field]: value } : r,
      ),
    }));
  };

  const updateVariantOption = (
    rowId: string,
    typeId: string,
    optionId: string,
  ) => {
    setForm((p) => ({
      ...p,
      variants: p.variants.map((r) =>
        r.id === rowId
          ? {
              ...r,
              combination: r.combination.map((c) =>
                c.variant_type_id === typeId
                  ? { ...c, variant_option_id: optionId }
                  : c,
              ),
            }
          : r,
      ),
    }));
  };

  const handleVariantImages = (rowId: string, files: FileList) => {
    const valid: File[] = [];
    const previews: string[] = [];
    Array.from(files).forEach((f) => {
      if (!validateImageFile(f)) {
        valid.push(f);
        previews.push(URL.createObjectURL(f));
      }
    });

    setForm((p) => ({
      ...p,
      variants: p.variants.map((r) =>
        r.id === rowId
          ? {
              ...r,
              images: [...r.images, ...valid].slice(0, 5),
              imagePreviews: [...r.imagePreviews, ...previews].slice(0, 5),
            }
          : r,
      ),
    }));
  };

  const removeVariantImage = (rowId: string, imgIdx: number) => {
    setForm((p) => ({
      ...p,
      variants: p.variants.map((r) =>
        r.id === rowId
          ? {
              ...r,
              images: r.images.filter((_, i) => i !== imgIdx),
              imagePreviews: r.imagePreviews.filter((_, i) => i !== imgIdx),
            }
          : r,
      ),
    }));
  };

  const removeVariantRow = (rowId: string) => {
    setForm((p) => ({
      ...p,
      variants: p.variants.filter((r) => r.id !== rowId),
    }));
  };

  const errors = {
    name: touched.name && !form.name.trim() ? "Product name is required." : "",
    category_id:
      touched.category_id && !form.category_id ? "Category is required." : "",
    sku: touched.sku && !form.sku.trim() ? "SKU is required." : "",
    costPrice:
      touched.costPrice && !form.costPrice ? "Cost price is required." : "",
    sellingPrice:
      touched.sellingPrice && !form.sellingPrice
        ? "Selling price is required."
        : "",
    price: touched.price && !form.price ? "Price is required." : "",
    mainImage:
      mainImageError ??
      (touched.mainImage && !form.mainImage ? "Main image is required." : ""),
  };

  const isFormValid =
    !!form.name.trim() &&
    !!form.category_id &&
    !!form.sku.trim() &&
    !!form.costPrice &&
    !!form.sellingPrice &&
    !!form.price &&
    !!form.mainImage &&
    !mainImageError &&
    (!form.hasVariants ||
      (form.variantTypes.length > 0 &&
        form.variants.length > 0 &&
        form.variants.every((r) =>
          r.combination.every((c) => c.variant_option_id),
        )));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      name: true,
      category_id: true,
      sku: true,
      costPrice: true,
      sellingPrice: true,
      price: true,
      mainImage: true,
    });
    if (!isFormValid) return;

    const basePayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      short_description: form.short_description.trim(),
      category_id: form.category_id,
      sku: form.sku.trim(),
      currency: form.currency,
      costPrice: Number(form.costPrice),
      sellingPrice: Number(form.sellingPrice),
      price: Number(form.price),
      stock: form.stock ? Number(form.stock) : 0,
      mainImage: form.mainImage!,
      featuredImages: form.featuredImages.filter(
        (f) => f instanceof File,
      ) as File[],
      hasVariants: form.hasVariants,
      variantTypes: form.hasVariants ? form.variantTypes : [],
      variants: form.hasVariants
        ? form.variants.map((r) => ({
            _id: r._id,
            combination: r.combination,
            sku: r.sku || undefined,
            costPrice: r.costPrice ? Number(r.costPrice) : undefined,
            sellingPrice: r.sellingPrice ? Number(r.sellingPrice) : undefined,
            price: r.price ? Number(r.price) : undefined,
            stock: r.stock ? Number(r.stock) : 0,
            images: r.images,
          }))
        : [],
    };

    try {
      if (isEditMode && activeProductId) {
        await updateProduct({
          productId: activeProductId,
          data: basePayload as UpdateProductPayload,
        }).unwrap();

        toast.success("Product updated successfully", {
          description: `"${basePayload.name}" has been updated.`,
        });
      } else {
        await createProduct(basePayload as CreateProductPayload).unwrap();

        toast.success("Product created", {
          description: `"${basePayload.name}" has been added successfully.`,
        });
      }
      navigate("/admin/products");
    } catch (err: any) {
      toast.error(
        isEditMode ? "Failed to update product" : "Failed to create product",
        {
          description: err?.data?.message ?? "Something went wrong.",
        },
      );
    }
  };

  const marginVal = useMemo(() => {
    if (!form.sellingPrice || !form.costPrice) return null;
    const sp = Number(form.sellingPrice);
    const cp = Number(form.costPrice);
    if (sp <= 0) return null;
    return (((sp - cp) / sp) * 100).toFixed(1);
  }, [form.sellingPrice, form.costPrice]);

  if (isEditMode && isFetchingProduct) {
    return (
      <FullScreenLoader
        title="Loading Product"
        subtitle="Getting everything ready...."
      />
    );
  }

  return (
    <div className="ap-wrapper">
      <div className="ap-container">
        {/* Top Header */}
        <header className="ap-page-header">
          <div>
            <div className="ap-badge-tag">
              <Sparkles size={12} /> Product Manager
            </div>
            <h1 className="ap-title">
              {isEditMode ? "Edit Product" : "Add Product"}
            </h1>
            <p className="ap-subtitle">
              {isEditMode
                ? "Update product details and variations."
                : "Fill in the details to list a new product."}
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          <fieldset className="ap-fieldset" disabled={isSubmitting}>
            <div className="ap-grid-layout">
              {/* ── LEFT: FORM ── */}
              <div className="ap-col-main">
                {/* 01: General Info */}
                <section className="ap-card">
                  <div className="ap-card-head">
                    <div className="ap-card-icon-box ap-icon-indigo">
                      <Package size={18} />
                    </div>
                    <div>
                      <h2 className="ap-card-title">Basic Information</h2>
                      <p className="ap-card-desc">
                        Name, category, and descriptions.
                      </p>
                    </div>
                  </div>

                  <div className="ap-card-body">
                    <div className="ap-field">
                      <label className="ap-label" htmlFor="pro-name">
                        Product name <span className="ap-required">*</span>
                      </label>
                      <input
                        id="pro-name"
                        type="text"
                        className={`ap-input ${errors.name ? "is-invalid" : ""}`}
                        placeholder="e.g. Premium Cotton T-Shirt"
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        onBlur={() => touch("name")}
                      />
                      {errors.name && (
                        <p className="ap-error-msg">
                          <AlertCircle size={13} /> {errors.name}
                        </p>
                      )}
                    </div>

                    <div className="ap-row-2">
                      <div className="ap-field">
                        <label className="ap-label">
                          Category <span className="ap-required">*</span>
                        </label>
                        <LeafCategoryDropdown
                          value={form.category_id}
                          onChange={(catId) => {
                            set("category_id", catId);
                            touch("category_id");
                          }}
                          onBlur={() => touch("category_id")}
                          error={errors.category_id}
                        />
                        {errors.category_id && (
                          <p className="ap-error-msg">
                            <AlertCircle size={13} /> {errors.category_id}
                          </p>
                        )}
                      </div>

                      <div className="ap-field">
                        <label className="ap-label" htmlFor="pro-short-desc">
                          Short description
                        </label>
                        <input
                          id="pro-short-desc"
                          type="text"
                          className="ap-input"
                          placeholder="One line summary shown in listings"
                          value={form.short_description}
                          onChange={(e) =>
                            set("short_description", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="ap-field">
                      <label className="ap-label" htmlFor="pro-desc">
                        Full description
                      </label>
                      <textarea
                        id="pro-desc"
                        rows={4}
                        className="ap-input ap-textarea"
                        placeholder="Full product description…"
                        value={form.description}
                        onChange={(e) => set("description", e.target.value)}
                      />
                    </div>
                  </div>
                </section>

                {/* 02: Pricing & Inventory */}
                <section className="ap-card">
                  <div className="ap-card-head">
                    <div className="ap-card-icon-box ap-icon-emerald">
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <h2 className="ap-card-title">Pricing & Inventory</h2>
                      <p className="ap-card-desc">
                        SKU, currency, prices, and stock count.
                      </p>
                    </div>
                  </div>

                  <div className="ap-card-body">
                    <div className="ap-row-2">
                      <div className="ap-field">
                        <label className="ap-label" htmlFor="pro-sku">
                          SKU <span className="ap-required">*</span>
                        </label>
                        <input
                          id="pro-sku"
                          type="text"
                          className={`ap-input ap-mono ${errors.sku ? "is-invalid" : ""}`}
                          placeholder="e.g. TSHIRT-COTTON-L"
                          value={form.sku}
                          onChange={(e) =>
                            set("sku", e.target.value.toUpperCase())
                          }
                          onBlur={() => touch("sku")}
                        />
                        {errors.sku && (
                          <p className="ap-error-msg">
                            <AlertCircle size={13} /> {errors.sku}
                          </p>
                        )}
                      </div>

                      <div className="ap-field">
                        <label className="ap-label" htmlFor="pro-currency">
                          Currency
                        </label>
                        <div className="ap-select-box">
                          <select
                            id="pro-currency"
                            className="ap-select"
                            value={form.currency}
                            onChange={(e) => set("currency", e.target.value)}
                          >
                            {CURRENCIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="ap-row-3">
                      <div className="ap-field">
                        <label className="ap-label" htmlFor="pro-cost">
                          Cost price <span className="ap-required">*</span>
                        </label>
                        <div className="ap-price-input-group">
                          <span className="ap-currency-symbol">
                            {form.currency}
                          </span>
                          <input
                            id="pro-cost"
                            type="number"
                            min="0"
                            className={`ap-input ${errors.costPrice ? "is-invalid" : ""}`}
                            placeholder="0.00"
                            value={form.costPrice}
                            onChange={(e) => set("costPrice", e.target.value)}
                            onBlur={() => touch("costPrice")}
                          />
                        </div>
                        {errors.costPrice && (
                          <p className="ap-error-msg">
                            <AlertCircle size={13} /> {errors.costPrice}
                          </p>
                        )}
                      </div>

                      <div className="ap-field">
                        <label className="ap-label" htmlFor="pro-selling">
                          Selling price <span className="ap-required">*</span>
                        </label>
                        <div className="ap-price-input-group">
                          <span className="ap-currency-symbol">
                            {form.currency}
                          </span>
                          <input
                            id="pro-selling"
                            type="number"
                            min="0"
                            className={`ap-input ${errors.sellingPrice ? "is-invalid" : ""}`}
                            placeholder="0.00"
                            value={form.sellingPrice}
                            onChange={(e) =>
                              set("sellingPrice", e.target.value)
                            }
                            onBlur={() => touch("sellingPrice")}
                          />
                        </div>
                        {errors.sellingPrice && (
                          <p className="ap-error-msg">
                            <AlertCircle size={13} /> {errors.sellingPrice}
                          </p>
                        )}
                      </div>

                      <div className="ap-field">
                        <label className="ap-label" htmlFor="pro-price">
                          MRP / Price <span className="ap-required">*</span>
                        </label>
                        <div className="ap-price-input-group">
                          <span className="ap-currency-symbol">
                            {form.currency}
                          </span>
                          <input
                            id="pro-price"
                            type="number"
                            min="0"
                            className={`ap-input ${errors.price ? "is-invalid" : ""}`}
                            placeholder="0.00"
                            value={form.price}
                            onChange={(e) => set("price", e.target.value)}
                            onBlur={() => touch("price")}
                          />
                        </div>
                        {errors.price && (
                          <p className="ap-error-msg">
                            <AlertCircle size={13} /> {errors.price}
                          </p>
                        )}
                      </div>
                    </div>

                    {!form.hasVariants && (
                      <div className="ap-row-2">
                        <div className="ap-field">
                          <label className="ap-label" htmlFor="pro-stock">
                            Stock qty
                          </label>
                          <input
                            id="pro-stock"
                            type="number"
                            min="0"
                            className="ap-input"
                            placeholder="0"
                            value={form.stock}
                            onChange={(e) => set("stock", e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* 03: Media */}
                <section className="ap-card">
                  <div className="ap-card-head">
                    <div className="ap-card-icon-box ap-icon-violet">
                      <UploadCloud size={18} />
                    </div>
                    <div>
                      <h2 className="ap-card-title">Media & Visual Assets</h2>
                      <p className="ap-card-desc">
                        {form.hasVariants
                          ? "Upload the primary hero image. Gallery images are managed per variant below."
                          : "Main product image and up to 6 gallery images."}
                      </p>
                    </div>
                  </div>

                  <div className="ap-card-body">
                    <ImageDropzone
                      label="Main hero image *"
                      preview={mainPreview}
                      error={errors.mainImage}
                      onFile={handleMainImage}
                      onRemove={removeMainImage}
                    />

                    {/* Gallery Images (shared across product, with or without variants) */}
                    <div className="ap-field" style={{ marginTop: 20 }}>
                      <label className="ap-label">
                        Gallery images{" "}
                        <span className="ap-muted">(up to 6)</span>
                      </label>
                      <div className="ap-gallery-grid">
                        {featuredPreviews.map((src, i) => (
                          <div key={i} className="ap-gallery-thumb">
                            <img src={getImageUrl(src)} alt="Gallery item" />
                            <button
                              type="button"
                              className="ap-gallery-remove"
                              onClick={() => removeFeatured(i)}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        {featuredPreviews.length < 6 && (
                          <button
                            type="button"
                            className="ap-gallery-add-card"
                            onClick={() => featuredRef.current?.click()}
                          >
                            <Plus size={20} />
                            <span>Add Photo</span>
                          </button>
                        )}
                      </div>
                      <input
                        ref={featuredRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={(e) => {
                          if (e.target.files)
                            handleFeaturedImages(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </div>
                </section>

                {/* 04: Variants */}
                <section className="ap-card">
                  <div className="ap-card-head ap-flex-between">
                    <div className="ap-head-group">
                      <div className="ap-card-icon-box ap-icon-amber">
                        <Layers size={18} />
                      </div>
                      <div>
                        <h2 className="ap-card-title">Product Variants</h2>
                        <p className="ap-card-desc">
                          Enable if product has sizes, colors, and separate
                          images.
                        </p>
                      </div>
                    </div>
                    <label className="ap-switch-label">
                      <input
                        type="checkbox"
                        checked={form.hasVariants}
                        onChange={(e) => {
                          set("hasVariants", e.target.checked);
                          if (!e.target.checked) {
                            set("variantTypes", []);
                            set("variants", []);
                          }
                        }}
                      />
                      <span className="ap-switch-slider" />
                    </label>
                  </div>

                  {form.hasVariants && (
                    <div className="ap-card-body">
                      <div className="ap-field">
                        <label className="ap-label">Variant types</label>
                        <div className="ap-chip-list">
                          {vtLoading ? (
                            <span className="ap-muted">Loading types…</span>
                          ) : (
                            variantTypes.map((vt) => {
                              const active = form.variantTypes.includes(vt._id);
                              return (
                                <button
                                  type="button"
                                  key={vt._id}
                                  className={`ap-filter-chip ${active ? "is-selected" : ""}`}
                                  onClick={() => {
                                    set(
                                      "variantTypes",
                                      active
                                        ? form.variantTypes.filter(
                                            (id) => id !== vt._id,
                                          )
                                        : [...form.variantTypes, vt._id],
                                    );
                                  }}
                                >
                                  {active && <CheckCircle2 size={13} />}
                                  {vt.name}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {form.variantTypes.length > 0 && (
                        <div className="ap-variant-stack">
                          {form.variants.map((row, idx) => {
                            const variantFileInputRef =
                              React.createRef<HTMLInputElement>();
                            return (
                              <div key={row.id} className="ap-variant-card">
                                <div className="ap-variant-top">
                                  <div className="ap-variant-id">
                                    <span>#{idx + 1}</span>
                                  </div>

                                  <div className="ap-variant-combos">
                                    {row.combination.map((c) => {
                                      const vt = variantTypes.find(
                                        (v) => v._id === c.variant_type_id,
                                      );
                                      return (
                                        <div
                                          key={c.variant_type_id}
                                          className="ap-variant-combo-pill"
                                        >
                                          <span className="ap-combo-type-name">
                                            {vt?.name ?? "Option"}:
                                          </span>
                                          <VariantOptionSelect
                                            typeId={c.variant_type_id}
                                            value={c.variant_option_id}
                                            onChange={(optId) =>
                                              updateVariantOption(
                                                row.id,
                                                c.variant_type_id,
                                                optId,
                                              )
                                            }
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {form.variants.length > 1 && (
                                    <button
                                      type="button"
                                      className="ap-variant-del-btn"
                                      onClick={() => removeVariantRow(row.id)}
                                      title="Delete item"
                                      style={{ marginLeft: "auto" }}
                                    >
                                      <MdDelete size={17} />
                                    </button>
                                  )}
                                </div>

                                <div className="ap-variant-inputs-grid">
                                  <div className="ap-field-sm">
                                    <label>SKU</label>
                                    <input
                                      type="text"
                                      className="ap-input ap-input-sm ap-mono"
                                      placeholder="SKU"
                                      value={row.sku}
                                      onChange={(e) =>
                                        updateVariantRow(
                                          row.id,
                                          "sku",
                                          e.target.value.toUpperCase(),
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="ap-field-sm">
                                    <label>Cost</label>
                                    <input
                                      type="number"
                                      className="ap-input ap-input-sm"
                                      placeholder="0.00"
                                      value={row.costPrice}
                                      onChange={(e) =>
                                        updateVariantRow(
                                          row.id,
                                          "costPrice",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="ap-field-sm">
                                    <label>Selling</label>
                                    <input
                                      type="number"
                                      className="ap-input ap-input-sm"
                                      placeholder="0.00"
                                      value={row.sellingPrice}
                                      onChange={(e) =>
                                        updateVariantRow(
                                          row.id,
                                          "sellingPrice",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="ap-field-sm">
                                    <label>MRP</label>
                                    <input
                                      type="number"
                                      className="ap-input ap-input-sm"
                                      placeholder="0.00"
                                      value={row.price}
                                      onChange={(e) =>
                                        updateVariantRow(
                                          row.id,
                                          "price",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="ap-field-sm">
                                    <label>Stock</label>
                                    <input
                                      type="number"
                                      className="ap-input ap-input-sm"
                                      placeholder="Qty"
                                      value={row.stock}
                                      onChange={(e) =>
                                        updateVariantRow(
                                          row.id,
                                          "stock",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="ap-variant-media-row">
                                  <label className="ap-variant-media-label">
                                    <ImageIcon size={13} /> Variant Media
                                    (optional, up to 5 images)
                                  </label>
                                  <div className="ap-gallery-grid ap-gallery-grid-compact">
                                    {row.imagePreviews.map((src, i) => (
                                      <div key={i} className="ap-gallery-thumb">
                                        <img
                                          src={getImageUrl(src)}
                                          alt="Variant asset"
                                        />
                                        <button
                                          type="button"
                                          className="ap-gallery-remove"
                                          onClick={() =>
                                            removeVariantImage(row.id, i)
                                          }
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    ))}
                                    {row.imagePreviews.length < 5 && (
                                      <button
                                        type="button"
                                        className="ap-gallery-add-card ap-gallery-add-card-sm"
                                        onClick={() =>
                                          variantFileInputRef.current?.click()
                                        }
                                      >
                                        <Plus size={16} />
                                        <span>Add</span>
                                      </button>
                                    )}
                                  </div>
                                  <input
                                    ref={variantFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    hidden
                                    onChange={(e) => {
                                      if (e.target.files)
                                        handleVariantImages(
                                          row.id,
                                          e.target.files,
                                        );
                                      e.target.value = "";
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}

                          <button
                            type="button"
                            className="ap-add-variant-btn"
                            onClick={addVariantRow}
                          >
                            <Plus size={16} /> Add Another Variant Combination
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>

              {/* ── RIGHT: LIVE PREVIEW & AUDIT ── */}
              {/* ── RIGHT: LIVE PREVIEW & AUDIT ── */}
              <div className="ap-col-sidebar">
                <div className="ap-sticky-stack">
                  {/* Live Preview Card */}
                  <div className="ap-preview-card">
                    <div className="ap-preview-header">
                      <div className="ap-flex-align">
                        <Eye size={14} />
                        <span>Live Preview</span>
                      </div>
                      <span className="ap-live-badge">
                        {isEditMode ? "EDITING" : "PREVIEW"}
                      </span>
                    </div>

                    {/* Thumbnail */}
                    <div className="ap-preview-thumb">
                      {mainPreview ? (
                        <img
                          src={getImageUrl(mainPreview)}
                          alt="Live display"
                        />
                      ) : (
                        <div className="ap-preview-empty">
                          <UploadCloud size={28} />
                          <span>No image yet</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="ap-preview-content">
                      {/* Name */}
                      <h4 className="ap-preview-title">
                        {form.name || (
                          <span className="ap-preview-ph">Product name</span>
                        )}
                      </h4>

                      {/* SKU */}
                      <p className="ap-preview-sku-line">
                        SKU: <span>{form.sku || "—"}</span>
                      </p>

                      {/* Category */}
                      {form.category_id && (
                        <p className="ap-preview-meta-line">
                          <span className="ap-preview-meta-key">Category</span>
                          <span className="ap-preview-meta-val">
                            {/* show name if found, else id */}
                            Selected ✓
                          </span>
                        </p>
                      )}

                      {/* Short description */}
                      {form.short_description && (
                        <p className="ap-preview-short-desc">
                          {form.short_description}
                        </p>
                      )}

                      {/* Pricing row */}
                      <div className="ap-preview-pricing">
                        <div className="ap-main-price">
                          {form.currency}{" "}
                          {form.sellingPrice
                            ? Number(form.sellingPrice).toLocaleString("en-IN")
                            : "0"}
                        </div>
                        {form.price &&
                          Number(form.price) > Number(form.sellingPrice) && (
                            <div className="ap-mrp-price">
                              {form.currency}{" "}
                              {Number(form.price).toLocaleString("en-IN")}
                            </div>
                          )}
                        {form.price &&
                          form.sellingPrice &&
                          Number(form.price) > Number(form.sellingPrice) && (
                            <span className="ap-preview-discount-badge">
                              {Math.round(
                                ((Number(form.price) -
                                  Number(form.sellingPrice)) /
                                  Number(form.price)) *
                                  100,
                              )}
                              % OFF
                            </span>
                          )}
                      </div>

                      {/* Tags row */}
                      <div className="ap-preview-tags-row">
                        <span className="ap-preview-tag-pill ap-tag-pending">
                          {form.status ? form.status : "Pending"}
                        </span>
                        {form.hasVariants && (
                          <span className="ap-preview-tag-pill ap-tag-variant">
                            Has variants
                          </span>
                        )}
                        {!form.hasVariants && form.stock && (
                          <span
                            className={`ap-preview-tag-pill ${
                              Number(form.stock) > 0
                                ? "ap-tag-instock"
                                : "ap-tag-outstock"
                            }`}
                          >
                            {Number(form.stock) > 0
                              ? `${form.stock} in stock`
                              : "Out of stock"}
                          </span>
                        )}
                      </div>

                      {/* Featured images strip */}
                      {featuredPreviews.length > 0 && (
                        <div className="ap-preview-gallery-strip">
                          {featuredPreviews.slice(0, 4).map((src, i) => (
                            <div key={i} className="ap-preview-gallery-dot">
                              <img src={getImageUrl(src)} alt="" />
                            </div>
                          ))}
                          {featuredPreviews.length > 4 && (
                            <div className="ap-preview-gallery-dot ap-preview-gallery-more">
                              +{featuredPreviews.length - 4}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Variant summary */}
                      {form.hasVariants && form.variants.length > 0 && (
                        <div className="ap-preview-variant-summary">
                          <span className="ap-preview-variant-count">
                            {form.variants.length} variant
                            {form.variants.length > 1 ? "s" : ""} configured
                          </span>
                          <div className="ap-preview-variant-dots">
                            {form.variants.slice(0, 5).map((_, i) => (
                              <span
                                key={i}
                                className={`ap-preview-vdot ${
                                  form.variants[i].combination.every(
                                    (c) => c.variant_option_id,
                                  )
                                    ? "is-complete"
                                    : "is-incomplete"
                                }`}
                              />
                            ))}
                            {form.variants.length > 5 && (
                              <span className="ap-preview-vdot-more">
                                +{form.variants.length - 5}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Margin Overview */}
                  {(form.costPrice || form.sellingPrice || form.price) && (
                    <div className="ap-metrics-card">
                      <h4 className="ap-metrics-title">Price Breakdown</h4>

                      <div className="ap-metric-row">
                        <span className="ap-metric-label">Cost price</span>
                        <span className="ap-metric-val ap-font-mono">
                          {form.costPrice
                            ? `${form.currency} ${Number(form.costPrice).toLocaleString("en-IN")}`
                            : "—"}
                        </span>
                      </div>
                      <div className="ap-metric-row">
                        <span className="ap-metric-label">Selling price</span>
                        <span className="ap-metric-val ap-font-mono">
                          {form.sellingPrice
                            ? `${form.currency} ${Number(form.sellingPrice).toLocaleString("en-IN")}`
                            : "—"}
                        </span>
                      </div>
                      <div className="ap-metric-row">
                        <span className="ap-metric-label">MRP</span>
                        <span className="ap-metric-val ap-font-mono">
                          {form.price
                            ? `${form.currency} ${Number(form.price).toLocaleString("en-IN")}`
                            : "—"}
                        </span>
                      </div>

                      <div className="ap-metric-divider" />

                      <div className="ap-metric-row">
                        <span className="ap-metric-label">Gross margin</span>
                        <span
                          className={`ap-metric-val ap-font-mono ${
                            marginVal && Number(marginVal) > 0
                              ? "ap-metric-positive"
                              : "ap-metric-negative"
                          }`}
                        >
                          {form.sellingPrice && form.costPrice
                            ? `${form.currency} ${(
                                Number(form.sellingPrice) -
                                Number(form.costPrice)
                              ).toLocaleString("en-IN")}`
                            : "—"}
                        </span>
                      </div>
                      <div className="ap-metric-row">
                        <span className="ap-metric-label">Margin %</span>
                        <span
                          className={`ap-metric-val ap-font-mono ${
                            marginVal && Number(marginVal) > 0
                              ? "ap-metric-positive"
                              : "ap-metric-negative"
                          }`}
                        >
                          {marginVal ? `${marginVal}%` : "—"}
                        </span>
                      </div>

                      <div className="ap-metric-progress">
                        <div
                          className="ap-metric-bar"
                          style={{
                            width: `${Math.min(
                              Math.max(Number(marginVal || 0), 0),
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="ap-metric-hint">
                        {Number(marginVal) > 30
                          ? "✓ Healthy margin"
                          : Number(marginVal) > 10
                            ? "⚠ Low margin"
                            : "✗ Review pricing"}
                      </p>
                    </div>
                  )}

                  {/* Readiness checklist */}
                  <div className="ap-checklist-card">
                    <h4 className="ap-checklist-title">Readiness</h4>
                    <ul className="ap-checklist">
                      {[
                        { label: "Product name", done: !!form.name.trim() },
                        {
                          label: "Category selected",
                          done: !!form.category_id,
                        },
                        { label: "SKU set", done: !!form.sku.trim() },
                        {
                          label: "Main image uploaded",
                          done: !!form.mainImage,
                        },
                        {
                          label: "Pricing complete",
                          done:
                            !!form.costPrice &&
                            !!form.sellingPrice &&
                            !!form.price,
                        },
                        {
                          label: form.hasVariants
                            ? "Variants configured"
                            : "Stock entered",
                          done: form.hasVariants
                            ? form.variants.length > 0 &&
                              form.variants.every((r) =>
                                r.combination.every((c) => c.variant_option_id),
                              )
                            : !!form.stock,
                        },
                      ].map(({ label, done }) => (
                        <li key={label} className={done ? "done" : ""}>
                          {done ? (
                            <CheckCircle2 size={15} color="#16a34a" />
                          ) : (
                            <AlertCircle size={15} color="#cbd5e1" />
                          )}
                          {label}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>

          <div className="ap-bottom-actions-dock">
            <button
              type="button"
              className="ap-btn ap-btn-secondary"
              onClick={() => navigate("/admin/products")}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ap-btn ap-btn-primary"
              disabled={!isFormValid || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <span className="ap-spinner-inline" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              {isSubmitting
                ? isEditMode
                  ? "Updating…"
                  : "Creating…"
                : isEditMode
                  ? "Update Product"
                  : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
