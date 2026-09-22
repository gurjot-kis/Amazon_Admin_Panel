import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useGetCategoriesSelectListQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "../../../features/category/categoryApi";
import type { FlatCategoryOption } from "../../../features/category/categoryTypes";
import "../../../styles/category/AddCategory.css";
import { FullScreenLoader } from "../../../components/common/FullScreenLoader";

export interface ExtendedFormState {
  name: string;
  parent_id: string;
  description: string;
  category_image: File | null;
}

const initialState: ExtendedFormState = {
  name: "",
  parent_id: "",
  description: "",
  category_image: null,
};

const MAX_IMAGE_MB = 4;

interface ParentCategorySelectProps {
  options: FlatCategoryOption[];
  value: string;
  onChange: (id: string) => void;
  loading?: boolean;
  errored?: boolean;
  disabledOptionId?: string;
}

const ParentCategorySelect: React.FC<ParentCategorySelectProps> = ({
  options,
  value,
  onChange,
  loading,
  errored,
  disabledOptionId,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o._id === value) ?? null;

  const filtered = useMemo(() => {
    let opts = options;
    if (disabledOptionId) {
      opts = opts.filter((o) => o._id !== disabledOptionId);
    }
    if (!query.trim()) return opts;
    const q = query.trim().toLowerCase();
    return opts.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query, disabledOptionId]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  const disabled = loading || errored;

  return (
    <div className={`cc-select ${open ? "is-open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className={`cc-select-trigger ${errored ? "is-invalid" : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={`cc-select-value ${!selected ? "is-placeholder" : ""}`}
        >
          {loading
            ? "Loading categories…"
            : selected
              ? selected.name
              : "No parent (top-level)"}
        </span>
        <span
          className={`cc-select-chevron ${open ? "is-open" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open && !disabled && (
        <div className="cc-select-panel">
          <div className="cc-select-search">
            <span className="cc-select-search-icon" aria-hidden>
              ⌕
            </span>
            <input
              autoFocus
              type="text"
              placeholder="Search categories…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <ul className="cc-select-list" role="listbox">
            <li
              className={`cc-select-option ${!value ? "is-selected" : ""}`}
              onClick={() => handleSelect("")}
              role="option"
              aria-selected={!value}
            >
              <span className="cc-select-option-label">
                — No parent (top-level) —
              </span>
              {!value && <span className="cc-select-check">✓</span>}
            </li>

            {filtered.map((opt) => (
              <li
                key={opt._id}
                className={`cc-select-option ${value === opt._id ? "is-selected" : ""}`}
                onClick={() => handleSelect(opt._id)}
                role="option"
                aria-selected={value === opt._id}
              >
                {opt.depth > 0 && (
                  <span className="cc-select-indent">
                    {Array.from({ length: opt.depth }).map((_, i) => (
                      <span key={i} className="cc-select-indent-line" />
                    ))}
                    <span className="cc-select-indent-dot" />
                  </span>
                )}
                <span className="cc-select-option-label">{opt.name}</span>
                <span className="cc-select-option-level">L{opt.level}</span>
                {value === opt._id && (
                  <span className="cc-select-check">✓</span>
                )}
              </li>
            ))}

            {filtered.length === 0 && (
              <li className="cc-select-empty">No matching categories</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const Spinner: React.FC = () => <span className="cc-spinner" aria-hidden />;

const CategoryForm: React.FC = () => {
  const { categoryId, id } = useParams<{ categoryId?: string; id?: string }>();
  const currentCategoryId = categoryId || id;
  const isEditMode = Boolean(currentCategoryId);

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ExtendedFormState>(initialState);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isImageRemoved, setIsImageRemoved] = useState(false);

  const {
    data: selectListRes,
    isLoading: parentsLoading,
    isError: parentsError,
  } = useGetCategoriesSelectListQuery();

  const { data: categoryDetailsRes, isLoading: isCategoryLoading } =
    useGetCategoryByIdQuery(currentCategoryId as string, {
      skip: !isEditMode,
    });

  const [createCategory, { isLoading: isCreating }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateCategoryMutation();

  const isSubmitting = isCreating || isUpdating;

  const parentOptions: FlatCategoryOption[] = useMemo(() => {
    return (selectListRes?.data || []).map((item) => ({
      _id: item._id,
      name: item.name,
      level: item.level,
      depth: item.depth,
    }));
  }, [selectListRes]);

  useEffect(() => {
    if (isEditMode && categoryDetailsRes) {
      const responseData = (categoryDetailsRes as any)?.data;
      if (responseData) {
        setIsImageRemoved(false);
        setForm({
          name: responseData.name || "",
          parent_id: responseData.parent_id || "",
          description: responseData.description || "",
          category_image: null,
        });
        if (responseData.category_image) {
          setImagePreview(
            import.meta.env.VITE_API_ASSET_URL + responseData.category_image,
          );
        }
      }
    }
  }, [isEditMode, categoryDetailsRes]);

  const selectedParent = useMemo(
    () => parentOptions.find((p) => p._id === form.parent_id) ?? null,
    [parentOptions, form.parent_id],
  );

  const trimmedName = form.name.trim();
  const trimmedDesc = form.description.trim();

  const errors = {
    name: !touched.name
      ? ""
      : !trimmedName
        ? "Category name is required."
        : trimmedName.length < 2
          ? "Category name is too short (min 2 characters)."
          : "",
    description: !touched.description
      ? ""
      : !trimmedDesc
        ? "Description is required."
        : trimmedDesc.length < 10
          ? "Add a little more detail (min 10 characters)."
          : "",
    image: imageError,
  };

  const isFormValid =
    form.name.trim().length >= 2 &&
    form.description.trim().length >= 10 &&
    !imageError;

  const handleFile = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Only image files are supported (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setImageError(`Image must be smaller than ${MAX_IMAGE_MB}MB.`);
      return;
    }
    setImageError(null);
    setIsImageRemoved(false);
    setForm((prev) => ({ ...prev, category_image: file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, category_image: null }));
    setImagePreview(null);
    setImageError(null);
    setIsImageRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const buildFormData = (): FormData => {
    const fd = new FormData();
    fd.append("name", form.name.trim());
    if (form.parent_id) fd.append("parent_id", form.parent_id);
    fd.append("description", form.description.trim());
    if (form.category_image) {
      fd.append("category_image", form.category_image);
    } else if (isEditMode && isImageRemoved) {
      fd.append("remove_image", "true");
    }
    return fd;
  };

  const handleCancelOrReset = () => {
    navigate("/admin/categories");
    setForm(initialState);
    setIsImageRemoved(false);
    removeImage();
    setTouched({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, description: true });
    if (!isFormValid) return;

    const categoryName = form.name.trim();

    try {
      if (isEditMode && currentCategoryId) {
        await updateCategory({
          categoryId: currentCategoryId,
          formData: buildFormData(),
        }).unwrap();
        toast.success("Category updated", {
          description: `"${categoryName}" has been updated successfully.`,
        });
      } else {
        await createCategory(buildFormData()).unwrap();
        toast.success("Category created", {
          description: `"${categoryName}" has been created successfully.`,
        });
      }
      navigate("/admin/categories");
    } catch (err: any) {
      console.error("Operation failed:", err);
      const errMsg =
        err?.data?.message || "Something went wrong. Please try again.";
      toast.error(`Failed to ${isEditMode ? "update" : "create"} category`, {
        description: errMsg,
      });
    }
  };

  if (isEditMode && isCategoryLoading) {
    return (
      <FullScreenLoader
        title="Loading Category"
        subtitle="Retrieving category details..."
      />
    );
  }

  return (
    <div className="cc-page">
      <div className="container-fluid cc-container">
        <div className="cc-header">
          <div>
            <p className="cc-eyebrow">Category Manager</p>
            <h1 className="cc-title">
              {isEditMode ? "Edit Category" : "Add Category"}
            </h1>
            <p className="cc-subtitle">
              {isEditMode
                ? "Update service category details."
                : "Create a new service category."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} onReset={handleCancelOrReset} noValidate>
          <fieldset className="cc-fieldset" disabled={isSubmitting}>
            <div className="row g-4 cc-body">
              <div className="col-12 col-lg-8">
                <section className="cc-card">
                  <header className="cc-card-header">
                    <span className="cc-card-index">01</span>
                    <div>
                      <h2>Category details</h2>
                      <p>The name and description shown to customers.</p>
                    </div>
                  </header>

                  <div className="cc-field">
                    <label htmlFor="cc-name">Category name</label>
                    <input
                      id="cc-name"
                      type="text"
                      className={`form-control cc-input ${errors.name ? "is-invalid" : ""}`}
                      placeholder="e.g. Sofa Cleaning"
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                      onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    />
                    {errors.name && (
                      <div className="cc-error">{errors.name}</div>
                    )}
                  </div>

                  <div className="cc-field">
                    <label htmlFor="cc-description">Description</label>
                    <textarea
                      id="cc-description"
                      className={`form-control cc-input cc-textarea ${errors.description ? "is-invalid" : ""}`}
                      placeholder="Describe what this category covers…"
                      rows={4}
                      value={form.description}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, description: e.target.value }))
                      }
                      onBlur={() =>
                        setTouched((t) => ({ ...t, description: true }))
                      }
                    />
                    <div className="cc-field-footer">
                      {errors.description ? (
                        <span className="cc-error">{errors.description}</span>
                      ) : (
                        <span className="cc-hint">
                          Shown on the category card and search results.
                        </span>
                      )}
                      <span className="cc-count">
                        {form.description.length}/300
                      </span>
                    </div>
                  </div>
                </section>

                <section className="cc-card">
                  <header className="cc-card-header">
                    <span className="cc-card-index">02</span>
                    <div>
                      <h2>Hierarchy</h2>
                      <p>
                        Pick a parent to nest this category, or leave blank for
                        a top-level category.
                      </p>
                    </div>
                  </header>

                  <div className="cc-field">
                    <label htmlFor="cc-parent">Parent category</label>
                    <ParentCategorySelect
                      options={parentOptions}
                      value={form.parent_id}
                      onChange={(id) =>
                        setForm((p) => ({ ...p, parent_id: id }))
                      }
                      loading={parentsLoading}
                      errored={parentsError}
                      disabledOptionId={currentCategoryId}
                    />
                    {parentsError && (
                      <div className="cc-error">
                        Couldn't load categories. Parent selection is
                        unavailable right now.
                      </div>
                    )}
                    {!parentsLoading && !parentsError && selectedParent && (
                      <div className="cc-hint">
                        Assigned under: <strong>{selectedParent.name}</strong>{" "}
                        <span className="cc-select-option-level">
                          L{selectedParent.level}
                        </span>
                      </div>
                    )}
                  </div>
                </section>

                <section className="cc-card">
                  <header className="cc-card-header">
                    <span className="cc-card-index">03</span>
                    <div>
                      <h2>Category image</h2>
                      <p>Used as the tile thumbnail across the app.</p>
                    </div>
                  </header>

                  <div
                    className={`cc-dropzone ${isDragging ? "is-dragging" : ""} ${errors.image ? "is-invalid" : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleFile(e.dataTransfer.files?.[0]);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                  >
                    {imagePreview ? (
                      <div className="cc-preview-wrap">
                        <img
                          src={imagePreview}
                          alt="Category preview"
                          className="cc-dropzone-image"
                        />
                        <button
                          type="button"
                          className="cc-remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage();
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="cc-dropzone-empty">
                        <div className="cc-dropzone-icon">⤒</div>
                        <p className="cc-dropzone-title">
                          Drag &amp; drop an image, or click to browse
                        </p>
                        <p className="cc-dropzone-hint">
                          PNG, JPG or WEBP · up to {MAX_IMAGE_MB}MB
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handleFile(e.target.files?.[0])}
                    />
                  </div>
                  {errors.image && (
                    <div className="cc-error">{errors.image}</div>
                  )}
                </section>

                <div className="cc-actions">
                  <button type="reset" className="btn cc-btn-ghost">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn cc-btn-primary"
                    disabled={!isFormValid || isSubmitting}
                  >
                    {isSubmitting && <Spinner />}
                    {isSubmitting
                      ? isEditMode
                        ? "Updating…"
                        : "Creating…"
                      : isEditMode
                        ? "Update category"
                        : "Create category"}
                  </button>
                </div>
              </div>

              <div className="col-12 col-lg-4">
                <div className="cc-sticky">
                  <div className="cc-preview-card">
                    <p className="cc-preview-label">Live preview</p>
                    <div className="cc-tile">
                      <div className="cc-tile-image">
                        {imagePreview ? (
                          <img src={imagePreview} alt="" />
                        ) : (
                          <span className="cc-tile-placeholder">
                            No image yet
                          </span>
                        )}
                      </div>
                      <div className="cc-tile-body">
                        <p className="cc-tile-name">
                          {form.name || "Category name"}
                        </p>
                        <p className="cc-tile-desc">
                          {form.description ||
                            "Category description will appear here as you type."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;
