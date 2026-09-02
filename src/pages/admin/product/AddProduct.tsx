import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetActiveCategoriesQuery } from "../../../features/category/categoryApi";
import {
  useCreateProductMutation,
  useGetProductByIdQuery,
  useUpdateProductMutation,
} from "../../../features/product/productApi";
import type {
  ProductFormState,
  CreateProductVariant,
} from "../../../features/product/productTypes";
import "../../../styles/product/AddProduct.css";
import type { Category } from "../../../features/category/categoryTypes";
import { FullScreenLoader } from "../../../components/common/FullScreenLoader";

const emptyVariant = (): CreateProductVariant => ({
  label: "",
  price: 0,
  costPrice: "",
  imageFile: null,
});

const initialForm: ProductFormState = {
  name: "",
  description: "",
  shortDescription: "",
  category_id: "",
  sub_category_id: "",
  vendor_id: "",
  basePrice: "",
  variantLabel: "",
  durationMinutes: "",
  includes: [],
  variants: [],
  mainImage: null,
  featuredImages: [],
};

// ---- tiny inline icon set (no external icon dependency) --------------------
const Icon = {
  Identity: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M4 7h16M4 12h10M4 17h7" strokeLinecap="round" />
    </svg>
  ),
  Layers: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M12 3 3 8l9 5 9-5-9-5Z" strokeLinejoin="round" />
      <path d="m3 13 9 5 9-5" strokeLinejoin="round" />
    </svg>
  ),
  Tag: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path
        d="M11 3h6a2 2 0 0 1 2 2v6l-9.5 9.5a1.5 1.5 0 0 1-2 0L3 16a1.5 1.5 0 0 1 0-2L11 3Z"
        strokeLinejoin="round"
      />
      <circle cx="15.5" cy="8.5" r="1.3" />
    </svg>
  ),
  List: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M9 6h11M9 12h11M9 18h11" strokeLinecap="round" />
      <circle cx="4.5" cy="6" r="1.4" />
      <circle cx="4.5" cy="12" r="1.4" />
      <circle cx="4.5" cy="18" r="1.4" />
    </svg>
  ),
  Variant: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
    </svg>
  ),
  Image: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path
        d="m21 16-5.5-5.5L6 20"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Trash: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
  Close: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  ),
  Plus: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  ),
  Spinner: () => (
    <svg viewBox="0 0 24 24" fill="none" className="cpf-spin">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="42 100"
      />
    </svg>
  ),
};

export default function CreateProductForm() {
  const { productId } = useParams<{ productId: string }>();
  const isEditMode = Boolean(productId);
  const navigate = useNavigate();
  const API_ASSET_URL = import.meta.env.VITE_API_ASSET_URL;

  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useGetActiveCategoriesQuery();

  const categories: Category[] = categoriesResponse?.data ?? [];

  const {
    data: productResponse,
    isLoading: productLoading,
    isError: productError,
  } = useGetProductByIdQuery(productId as string, { skip: !isEditMode });

  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const submitting = creating || updating;

  const [form, setForm] = useState<ProductFormState>(initialForm);
  const [selectedL1, setSelectedL1] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [includeDraft, setIncludeDraft] = useState("");
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [existingMainImage, setExistingMainImage] = useState<string | null>(
    null,
  );
  const [existingFeaturedImages, setExistingFeaturedImages] = useState<
    string[]
  >([]);

  const mainImageRef = useRef<HTMLInputElement>(null);
  const featuredImagesRef = useRef<HTMLInputElement>(null);

  // ---- populate form from fetched product (edit mode) --------------------
  useEffect(() => {
    const product = productResponse?.data;
    if (!product) return;

    setForm({
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription,
      category_id: product.category_id,
      sub_category_id: product.sub_category_id ?? "",
      vendor_id: product.vendor_id ?? "",
      basePrice: product.basePrice,
      variantLabel: product.variantLabel,
      durationMinutes: product.durationMinutes,
      includes: product.includes ?? [],
      variants: (product.variants ?? []).map((v) => ({
        key: v.key,
        label: v.label,
        price: v.price,
        costPrice: v.costPrice,
        imageFile: null,
        existingImage: getAssetUrl(v.image),
      })),
      mainImage: null,
      featuredImages: [],
    });

    setSelectedL1(product.category_id);
    setSelectedSubCategory(product.sub_category_id ?? "");
    setExistingMainImage(getAssetUrl(product.mainImage));

    setExistingFeaturedImages(
      (product.images ?? [])
        .map((image) => getAssetUrl(image))
        .filter((image): image is string => Boolean(image)),
    );
  }, [productResponse]);

  // ---- category cascade ------------------------------------------------
  const l1 = useMemo(
    () => categories.find((c) => c._id === selectedL1),
    [categories, selectedL1],
  );

  const getLeafNodes = (nodes: Category[]): Category[] =>
    nodes.flatMap((node) =>
      node.children && node.children.length > 0
        ? getLeafNodes(node.children)
        : [node],
    );

  const subCategoryOptions = useMemo(
    () => (l1 ? getLeafNodes(l1.children ?? []) : []),
    [l1],
  );
  const subCategory = useMemo(
    () => subCategoryOptions.find((c) => c._id === selectedSubCategory),
    [subCategoryOptions, selectedSubCategory],
  );

  const categoryPath = [l1?.name, subCategory?.name]
    .filter(Boolean)
    .join(" / ");

  const handleSelectL1 = (id: string) => {
    setSelectedL1(id);
    setSelectedSubCategory("");
    setForm((f) => ({ ...f, category_id: id, sub_category_id: "" }));
  };

  const handleSelectSubCategory = (id: string) => {
    setSelectedSubCategory(id);
    setForm((f) => ({ ...f, sub_category_id: id }));
  };

  // ---- simple field helpers ---------------------------------------------
  const setField = <K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleText =
    (key: keyof ProductFormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setField(key, e.target.value as never);

  const handleNumber =
    (key: keyof ProductFormState) => (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setField(key, (raw === "" ? "" : Number(raw)) as never);
    };

  // ---- includes chips -----------------------------------------------------
  const addInclude = () => {
    const value = includeDraft.trim();
    if (!value) return;
    setField("includes", [...form.includes, value]);
    setIncludeDraft("");
  };

  const removeInclude = (index: number) =>
    setField(
      "includes",
      form.includes.filter((_, i) => i !== index),
    );

  // ---- variants -------------------------------------------------------
  const addVariant = () =>
    setField("variants", [...form.variants, emptyVariant()]);

  const updateVariant = (index: number, patch: Partial<CreateProductVariant>) =>
    setField(
      "variants",
      form.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    );

  const removeVariant = (index: number) =>
    setField(
      "variants",
      form.variants.filter((_, i) => i !== index),
    );

  // Each variant owns its own image directly now — no shared pool, no index
  // to keep in sync. Picking a file for variant #2 can never accidentally
  // affect variant #0.
  const handleVariantImageChange =
    (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      updateVariant(index, { imageFile: file });
      e.target.value = ""; // allow re-selecting the same file later
    };

  const clearVariantImage = (index: number) =>
    updateVariant(index, { imageFile: null, existingImage: null });

  // ---- images -----------------------------------------------------------
  const handleMainImage = (e: ChangeEvent<HTMLInputElement>) => {
    setField("mainImage", e.target.files?.[0] ?? null);
    setExistingMainImage(null); // new file replaces the preview entirely
  };

  const handleFeaturedImages = (e: ChangeEvent<HTMLInputElement>) => {
    setField("featuredImages", [
      ...form.featuredImages,
      ...Array.from(e.target.files ?? []),
    ]);
    setExistingFeaturedImages([]); // backend replaces all featured images on new upload
  };

  const removeFeaturedImage = (index: number) =>
    setField(
      "featuredImages",
      form.featuredImages.filter((_, i) => i !== index),
    );

  // ---- validation -----------------------------------------------------------
  const validate = (): string | null => {
    if (!form.name.trim()) return "Product name is required.";
    if (form.basePrice === "" || Number(form.basePrice) < 0)
      return "A valid base price is required.";
    if (!form.category_id) return "Please select a category.";
    if (!isEditMode && !form.mainImage) return "Main image is required.";
    for (const v of form.variants) {
      if (!v.label.trim()) return "Every variant needs a label.";
      if (v.price === "" || Number(v.price) < 0)
        return "Every variant needs a valid price.";
    }
    return null;
  };

  // ---- submit -------------------------------------------------------------
  const buildFormData = () => {
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("description", form.description);
    fd.append("shortDescription", form.shortDescription);
    fd.append("category_id", form.category_id);
    fd.append("sub_category_id", form.sub_category_id);
    fd.append("vendor_id", form.vendor_id);
    fd.append("basePrice", String(form.basePrice));
    fd.append("variantLabel", form.variantLabel);
    fd.append("durationMinutes", String(form.durationMinutes));
    fd.append("includes", JSON.stringify(form.includes));

    // 1. Send variants with their retained existing relative path / null
    fd.append(
      "variants",
      JSON.stringify(
        form.variants.map((v) => ({
          key: v.key,
          label: v.label,
          price: v.price,
          costPrice: v.costPrice,
          image: v.existingImage
            ? v.existingImage.replace(API_ASSET_URL, "")
            : null,
        })),
      ),
    );

    // 2. Track new variant images
    const variantImageSlots: number[] = [];
    form.variants.forEach((variant, index) => {
      if (variant.imageFile) {
        variantImageSlots.push(index);
        fd.append("variantImages", variant.imageFile);
      }
    });
    fd.append("variantImageSlots", JSON.stringify(variantImageSlots));

    // 3. Main image file & existing main image state
    if (form.mainImage) {
      fd.append("mainImage", form.mainImage);
    } else {
      fd.append(
        "existingMainImage",
        existingMainImage ? existingMainImage.replace(API_ASSET_URL, "") : "",
      );
    }

    // 4. Retained existing featured images + new featured image files
    const cleanedExistingImages = existingFeaturedImages.map((img) =>
      img.replace(API_ASSET_URL, ""),
    );
    fd.append("existingFeaturedImages", JSON.stringify(cleanedExistingImages));
    form.featuredImages.forEach((file) => fd.append("featuredImages", file));

    return fd;
  };

  const resetForm = () => {
    setForm(initialForm);
    setSelectedL1("");
    setSelectedSubCategory("");
    setIncludeDraft("");
    setExistingMainImage(null);
    setExistingFeaturedImages([]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);
    setSubmitError(null);

    const validationError = validate();
    if (validationError) {
      setSubmitMessage("error");
      setSubmitError(validationError);
      return;
    }

    try {
      const formData = buildFormData();
      if (isEditMode && productId) {
        await updateProduct({ productId, formData }).unwrap();
      } else {
        await createProduct(formData).unwrap();
        resetForm();
      }

      setSubmitMessage("success");
      navigate("/admin/products");
    } catch (err) {
      setSubmitMessage("error");
      setSubmitError(
        (err as { data?: { message?: string } })?.data?.message ||
          "Something went wrong. Please try again.",
      );
    }
  };

  // const previewJson = {
  //   name: form.name || "—",
  //   description: form.description || "—",
  //   shortDescription: form.shortDescription || "—",
  //   category_id: form.category_id || "—",
  //   sub_category_id: form.sub_category_id || "—",
  //   vendor_id: form.vendor_id || "—",
  //   basePrice: form.basePrice === "" ? "—" : form.basePrice,
  //   variantLabel: form.variantLabel || "—",
  //   durationMinutes: form.durationMinutes === "" ? "—" : form.durationMinutes,
  //   includes: form.includes,
  //   variants: form.variants.map((v) => ({
  //     key: v.key,
  //     label: v.label,
  //     price: v.price,
  //     costPrice: v.costPrice,
  //     image: v.imageFile?.name ?? v.existingImage ?? "—",
  //   })),
  //   mainImage: form.mainImage?.name ?? existingMainImage ?? "—",
  //   featuredImages: form.featuredImages.length
  //     ? form.featuredImages.map((f) => f.name)
  //     : existingFeaturedImages,
  // };

  const getAssetUrl = (image: string | null | undefined) => {
    if (!image) return null;

    // If backend already returns a complete URL, don't prepend it again
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    return `${API_ASSET_URL}${image.startsWith("/") ? "" : "/"}${image}`;
  };

  // Clear existing main image
  const clearMainImage = () => {
    setExistingMainImage(null);
    setField("mainImage", null);
  };

  // Remove single existing featured image
  const removeExistingFeaturedImage = (index: number) => {
    setExistingFeaturedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ---- full-page loader while fetching the existing product ---------------
  if (isEditMode && productLoading) {
    return (
      <FullScreenLoader
        title="Loading Product"
        subtitle="Getting everything ready...."
      />
    );
  }

  if (isEditMode && productError) {
    return (
      <div className="cpf-page-loader">
        <p>Couldn't load this product. It may have been removed.</p>
        <button
          type="button"
          className="cpf-btn cpf-btn--ghost"
          onClick={() => navigate(-1)}
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="cpf-page">
      <div className="cpf">
        <form className="cpf-form" onSubmit={handleSubmit}>
          <header className="cpf-header">
            <div>
              <p className="cpf-eyebrow">
                Catalog / {isEditMode ? "Edit listing" : "New listing"}
              </p>
              <h1 className="cpf-title">
                {isEditMode ? "Edit product" : "Create product"}
              </h1>
              <p className="cpf-subtitle">
                {isEditMode
                  ? "Update any section — the spec sheet on the right reflects your changes."
                  : "Fill in each section — the spec sheet on the right updates as you go."}
              </p>
            </div>
            <div className="cpf-header-actions">
              {/* <button type="button" className="cpf-btn cpf-btn--ghost">
              Save draft
            </button> */}
              <button
                type="submit"
                className="cpf-btn cpf-btn--primary"
                disabled={submitting}
              >
                {submitting && <Icon.Spinner />}
                {submitting
                  ? isEditMode
                    ? "Saving…"
                    : "Publishing…"
                  : isEditMode
                    ? "Save changes"
                    : "Publish product"}
              </button>
            </div>
          </header>

          {submitMessage === "success" && (
            <div className="cpf-banner cpf-banner--success">
              {isEditMode
                ? "Product updated successfully."
                : "Product published successfully."}
            </div>
          )}
          {submitMessage === "error" && (
            <div className="cpf-banner cpf-banner--error">
              {submitError || "Something went wrong. Please try again."}
            </div>
          )}

          {/* SECTION 1 — Identity */}
          <section className="cpf-section">
            <div className="cpf-section-head">
              <span className="cpf-section-icon">
                <Icon.Identity />
              </span>
              <div>
                <h2>Product identity</h2>
                <p>The name and descriptions shoppers see first.</p>
              </div>
            </div>
            <div className="cpf-grid">
              <label className="cpf-field cpf-field--full">
                <span>Product name</span>
                <input
                  type="text"
                  placeholder="e.g. Professional Ceramic Hair Straightener"
                  value={form.name}
                  onChange={handleText("name")}
                  required
                />
              </label>
              <label className="cpf-field cpf-field--full">
                <span>Short description</span>
                <input
                  type="text"
                  placeholder="One line shown on listing cards"
                  value={form.shortDescription}
                  onChange={handleText("shortDescription")}
                />
              </label>
              <label className="cpf-field cpf-field--full">
                <span>Full description</span>
                <textarea
                  rows={4}
                  placeholder="Describe materials, use-case and what makes it stand out"
                  value={form.description}
                  onChange={handleText("description")}
                />
              </label>
            </div>
          </section>

          {/* SECTION 2 — Classification */}
          <section className="cpf-section">
            <div className="cpf-section-head">
              <span className="cpf-section-icon">
                <Icon.Layers />
              </span>
              <div>
                <h2>Classification</h2>
                <p>Where this product lives in the catalog tree.</p>
              </div>
            </div>
            <div className="cpf-grid">
              <label className="cpf-field">
                <span>Category</span>
                <select
                  value={selectedL1}
                  onChange={(e) => handleSelectL1(e.target.value)}
                  disabled={categoriesLoading}
                >
                  <option value="">
                    {categoriesLoading
                      ? "Loading categories…"
                      : "Select category"}
                  </option>
                  {categories.map((c: Category) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {categoriesError && (
                  <em className="cpf-field-error">Couldn't load categories.</em>
                )}
              </label>

              <label className="cpf-field">
                <span>Sub-category</span>
                <select
                  value={selectedSubCategory}
                  onChange={(e) => handleSelectSubCategory(e.target.value)}
                  disabled={!subCategoryOptions.length}
                >
                  <option value="">
                    {subCategoryOptions.length
                      ? "Select sub-category"
                      : "No sub-categories"}
                  </option>
                  {subCategoryOptions.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="cpf-field">
                <span>Vendor</span>
                <select
                  value={form.vendor_id}
                  onChange={(e) => setField("vendor_id", e.target.value)}
                  disabled
                >
                  <option value="">No vendors added yet</option>
                </select>
                <em className="cpf-field-hint">
                  Vendor management is coming soon — leave unassigned for now.
                </em>
              </label>
            </div>
            {categoryPath && <p className="cpf-breadcrumb">{categoryPath}</p>}
          </section>

          {/* SECTION 3 — Pricing & fulfilment */}
          <section className="cpf-section">
            <div className="cpf-section-head">
              <span className="cpf-section-icon">
                <Icon.Tag />
              </span>
              <div>
                <h2>Pricing &amp; fulfilment</h2>
                <p>Base price and how long the service or delivery takes.</p>
              </div>
            </div>
            <div className="cpf-grid">
              <label className="cpf-field">
                <span>Base price (₹)</span>
                <input
                  type="number"
                  min={0}
                  placeholder="1299"
                  value={form.basePrice}
                  onChange={handleNumber("basePrice")}
                  required
                />
              </label>
              <label className="cpf-field">
                <span>Variant label</span>
                <input
                  type="text"
                  placeholder="e.g. Select Size"
                  value={form.variantLabel}
                  onChange={handleText("variantLabel")}
                />
              </label>
              <label className="cpf-field">
                <span>Duration (minutes)</span>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.durationMinutes}
                  onChange={handleNumber("durationMinutes")}
                />
              </label>
            </div>
          </section>

          {/* SECTION 4 — What's included */}
          <section className="cpf-section">
            <div className="cpf-section-head">
              <span className="cpf-section-icon">
                <Icon.List />
              </span>
              <div>
                <h2>What&apos;s included</h2>
                <p>Everything the customer receives in the box.</p>
              </div>
            </div>
            <div className="cpf-chip-input">
              <input
                type="text"
                placeholder="e.g. Heat Protection Glove"
                value={includeDraft}
                onChange={(e) => setIncludeDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addInclude();
                  }
                }}
              />
              <button
                type="button"
                className="cpf-btn cpf-btn--secondary"
                onClick={addInclude}
              >
                <Icon.Plus /> Add
              </button>
            </div>
            <div className="cpf-chip-list">
              {form.includes.length === 0 && (
                <span className="cpf-empty">No items added yet.</span>
              )}
              {form.includes.map((item, i) => (
                <span className="cpf-chip" key={`${item}-${i}`}>
                  {item}
                  <button
                    type="button"
                    onClick={() => removeInclude(i)}
                    aria-label={`Remove ${item}`}
                  >
                    <Icon.Close />
                  </button>
                </span>
              ))}
            </div>
          </section>

          {/* SECTION 5 — Variants */}
          <section className="cpf-section">
            <div className="cpf-section-head">
              <span className="cpf-section-icon">
                <Icon.Variant />
              </span>
              <div>
                <h2>Variants</h2>
                <p>
                  Size, quantity or tier options, each with its own image and
                  price.
                </p>
                {isEditMode && (
                  <p className="cpf-field-hint">
                    Cost price isn't returned by the API — re-enter it for any
                    variant you want to update.
                  </p>
                )}
              </div>
            </div>

            {form.variants.length === 0 && (
              <span className="cpf-empty">
                No variants yet — add one below.
              </span>
            )}

            <div className="cpf-variant-list">
              {form.variants.map((variant, i) => (
                <div className="cpf-variant-row" key={variant.key ?? i}>
                  <label className="cpf-variant-thumb">
                    {variant.imageFile ? (
                      <img
                        src={URL.createObjectURL(variant.imageFile)}
                        alt="Variant preview"
                      />
                    ) : variant.existingImage ? (
                      <img src={variant.existingImage} alt="Current variant" />
                    ) : (
                      <Icon.Image />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleVariantImageChange(i)}
                    />
                    {(variant.imageFile || variant.existingImage) && (
                      <button
                        type="button"
                        className="cpf-variant-thumb-clear"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          clearVariantImage(i);
                        }}
                        aria-label="Remove variant image"
                      >
                        <Icon.Close />
                      </button>
                    )}
                  </label>
                  <input
                    type="text"
                    placeholder="Label (e.g. Small)"
                    value={variant.label}
                    onChange={(e) =>
                      updateVariant(i, { label: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={variant.price}
                    onChange={(e) =>
                      updateVariant(i, {
                        price:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                  <input
                    type="number"
                    placeholder="Cost price"
                    value={variant.costPrice}
                    onChange={(e) =>
                      updateVariant(i, {
                        costPrice:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                  <button
                    type="button"
                    className="cpf-icon-btn"
                    onClick={() => removeVariant(i)}
                    aria-label="Remove variant"
                  >
                    <Icon.Trash />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="cpf-btn cpf-btn--secondary"
              onClick={addVariant}
            >
              <Icon.Plus /> Add variant
            </button>
          </section>

          {/* SECTION 6 — Media */}
          <section className="cpf-section">
            <div className="cpf-section-head">
              <span className="cpf-section-icon">
                <Icon.Image />
              </span>
              <div>
                <h2>Media</h2>
                <p>
                  Main listing image and gallery shots. Variant photos live in
                  the Variants section above.
                </p>
              </div>
            </div>

            <div className="cpf-media-grid">
              {/* Main Image */}
              <div className="cpf-media-block">
                <span className="cpf-media-label">Main image</span>
                <div
                  className="cpf-dropzone"
                  onClick={() => mainImageRef.current?.click()}
                >
                  {form.mainImage ? (
                    <img
                      src={URL.createObjectURL(form.mainImage)}
                      alt="Main preview"
                    />
                  ) : existingMainImage ? (
                    <img src={existingMainImage} alt="Current main" />
                  ) : (
                    <span>Click to upload</span>
                  )}
                </div>
                {(form.mainImage || existingMainImage) && (
                  <button
                    type="button"
                    className="cpf-btn cpf-btn--ghost"
                    style={{ marginTop: 8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      clearMainImage();
                    }}
                  >
                    Remove Main Image
                  </button>
                )}
                <input
                  ref={mainImageRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleMainImage}
                />
              </div>

              {/* Featured Images */}
              <div className="cpf-media-block">
                <span className="cpf-media-label">Featured images</span>
                <div className="cpf-thumb-row">
                  {existingFeaturedImages.map((url, i) => (
                    <div className="cpf-thumb" key={`existing-${i}`}>
                      <img src={url} alt={`Current featured ${i}`} />
                      <button
                        type="button"
                        onClick={() => removeExistingFeaturedImage(i)}
                        aria-label="Remove image"
                      >
                        <Icon.Close />
                      </button>
                    </div>
                  ))}

                  {form.featuredImages.map((file, i) => (
                    <div className="cpf-thumb" key={`new-${i}`}>
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Featured ${i}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeFeaturedImage(i)}
                        aria-label="Remove image"
                      >
                        <Icon.Close />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="cpf-thumb cpf-thumb--add"
                    onClick={() => featuredImagesRef.current?.click()}
                  >
                    <Icon.Plus />
                  </button>
                </div>
                <input
                  ref={featuredImagesRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleFeaturedImages}
                />
              </div>
            </div>
          </section>
        </form>

        {/* PREVIEW RAIL */}
        <aside className="cpf-preview">
          <div className="cpf-preview-sticky">
            <div className="cpf-tag-card">
              <div className="cpf-tag-hole" />
              <div className="cpf-tag-image">
                {form.mainImage ? (
                  <img
                    src={URL.createObjectURL(form.mainImage)}
                    alt="Product"
                  />
                ) : existingMainImage ? (
                  <img src={existingMainImage} alt="Product" />
                ) : (
                  <span>No image</span>
                )}
              </div>
              <p className="cpf-tag-category">
                {categoryPath || "Uncategorised"}
              </p>
              <h3 className="cpf-tag-name">
                {form.name || "Untitled product"}
              </h3>
              <p className="cpf-tag-short">
                {form.shortDescription || "Short description will appear here."}
              </p>
              <div className="cpf-tag-price">
                <span>
                  {form.basePrice === "" ? "₹—" : `₹${form.basePrice}`}
                </span>
                {form.durationMinutes !== "" && (
                  <em>{form.durationMinutes} min</em>
                )}
              </div>
              {form.includes.length > 0 && (
                <ul className="cpf-tag-includes">
                  {form.includes.slice(0, 4).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                  {form.includes.length > 4 && (
                    <li>+{form.includes.length - 4} more</li>
                  )}
                </ul>
              )}
            </div>

            {/* <div className="cpf-payload">
            <div className="cpf-payload-head">
              <span>form-data payload</span>
              <span className="cpf-payload-dot" />
            </div>
            <pre>{JSON.stringify(previewJson, null, 2)}</pre>
          </div> */}
          </div>
        </aside>
      </div>
    </div>
  );
}
