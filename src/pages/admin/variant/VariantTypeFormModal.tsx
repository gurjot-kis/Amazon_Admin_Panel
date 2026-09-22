import { useEffect, useState } from "react";
import {
  useGetVariantTypeByIdQuery,
  useCreateVariantTypeMutation,
  useUpdateVariantTypeMutation,
} from "../../../features/variant/variantApi";
import type { VariantType } from "../../../features/variant/variantTypes";
import { toast } from "sonner";
import "../../../styles/variant/VariantTypeFormModal.css";

/* ── icons (inline svg, no extra dep) ─────────────────── */
const IconVariant = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 3l9 4.5-9 4.5-9-4.5L12 3z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M3 12l9 4.5 9-4.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M3 16.5l9 4.5 9-4.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M18 6L6 18M6 6l12 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M12 8v4M12 16h.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/* ── types ─────────────────────────────────────────────── */
interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Pass undefined for Add, pass the full object (or just _id) for Edit */
  editTarget?: Pick<VariantType, "_id" | "name"> | null;
}

interface FormState {
  name: string;
  description: string;
  status: "active" | "inactive";
}

const DEFAULT_FORM: FormState = {
  name: "",
  description: "",
  status: "active",
};

/* ── component ─────────────────────────────────────────── */
const VariantTypeFormModal = ({ isOpen, onClose, editTarget }: Props) => {
  const isEdit = !!editTarget;
  const editId = editTarget?._id ?? "";

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  /* fetch by id only in edit mode */
  const {
    data: fetchedData,
    isLoading: isFetching,
    isError: isFetchError,
    refetch: retryFetch,
  } = useGetVariantTypeByIdQuery(editId, {
    skip: !isEdit || !isOpen,
  });

  const [createVariantType, { isLoading: isCreating }] =
    useCreateVariantTypeMutation();
  const [updateVariantType, { isLoading: isUpdating }] =
    useUpdateVariantTypeMutation();

  const isSubmitting = isCreating || isUpdating;

  /* populate form when edit data arrives */
  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && fetchedData) {
      const vt = (fetchedData as any)?.data ?? fetchedData;
      setForm({
        name: vt.name ?? "",
        description: vt.description ?? "",
        status: vt.status ?? "active",
      });
    } else if (!isEdit) {
      setForm(DEFAULT_FORM);
    }
    setErrors({});
  }, [isOpen, isEdit, fetchedData]);

  /* close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  /* ── validation ── */
  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Name is required.";
    else if (form.name.trim().length < 2)
      next.name = "Name must be at least 2 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
    //   description: form.description.trim(),
      status: form.status,
    };

    try {
      if (isEdit) {
        await updateVariantType({
          variantTypeId: editId,
          data: payload,
        }).unwrap();
        toast.success("Variant type updated", {
          description: `"${payload.name}" has been updated successfully.`,
        });
      } else {
        await createVariantType(payload).unwrap();
        toast.success("Variant type created", {
          description: `"${payload.name}" has been added.`,
        });
      }
      onClose();
    } catch (err: any) {
      const msg =
        err?.data?.message || "Something went wrong. Please try again.";
      toast.error(isEdit ? "Failed to update" : "Failed to create", {
        description: msg,
      });
    }
  };

  const renderBody = () => {
    if (isEdit && isFetching) {
      return (
        <div className="vtm-skeleton">
          {[120, "100%", 70, "100%", 70, 90].map((w, i) => (
            <div key={i}>
              {i % 2 === 0 && (
                <div
                  className="vtm-skeleton-line vtm-skeleton-label"
                  style={{ width: w }}
                />
              )}
              {i % 2 !== 0 && (
                <div
                  className="vtm-skeleton-line vtm-skeleton-input"
                  style={{ width: w }}
                />
              )}
            </div>
          ))}
        </div>
      );
    }

    if (isEdit && isFetchError) {
      return (
        <div className="vtm-fetch-error">
          <IconAlert />
          <span>Couldn't load variant type details.</span>
          <button className="vtm-retry-btn" onClick={() => retryFetch()}>
            Retry
          </button>
        </div>
      );
    }

    return (
      <>
        {/* Name */}
        <div className="vtm-field">
          <label className="vtm-label">
            Name <span className="vtm-required">*</span>
          </label>
          <input
            className={`vtm-input${errors.name ? " vtm-input--error" : ""}`}
            type="text"
            placeholder="e.g. Color, Size, Material"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            autoFocus
          />
          {errors.name && <span className="vtm-error-msg">{errors.name}</span>}
        </div>

        {/* Description */}
        {/* <div className="vtm-field">
          <label className="vtm-label">Description</label>
          <textarea
            className="vtm-textarea"
            placeholder="Optional — describe what this variant type represents."
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={3}
          />
        </div> */}

        {/* Status — only show in edit mode */}
        {isEdit && (
          <div className="vtm-status-row">
            <div className="vtm-status-label-group">
              <span className="vtm-label">Status</span>
              <span className="vtm-status-hint">
                {form.status === "active"
                  ? "Visible and in use"
                  : "Hidden from use"}
              </span>
            </div>
            <label className="vtm-toggle">
              <input
                type="checkbox"
                checked={form.status === "active"}
                onChange={(e) =>
                  handleChange(
                    "status",
                    e.target.checked ? "active" : "inactive",
                  )
                }
              />
              <span className="vtm-toggle-track" />
            </label>
          </div>
        )}
      </>
    );
  };

  return (
    <div
      className="vtm-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="vtm-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vtm-title"
      >
        {/* Header */}
        <div className="vtm-header">
          <div className="vtm-header-left">
            <span className="vtm-icon">
              <IconVariant />
            </span>
            <h2 className="vtm-title" id="vtm-title">
              {isEdit ? "Edit Variant Type" : "Add Variant Type"}
            </h2>
          </div>
          <button
            className="vtm-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <IconClose />
          </button>
        </div>

        {/* Body */}
        <div className="vtm-body">{renderBody()}</div>

        {/* Footer */}
        {!(isEdit && isFetchError) && (
          <div className="vtm-footer">
            <button
              className="vtm-btn vtm-btn--cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="vtm-btn vtm-btn--submit"
              onClick={handleSubmit}
              disabled={isSubmitting || (isEdit && isFetching)}
            >
              {isSubmitting && <span className="vtm-spinner" />}
              {isSubmitting
                ? isEdit
                  ? "Saving…"
                  : "Adding…"
                : isEdit
                  ? "Save Changes"
                  : "Add Variant Type"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VariantTypeFormModal;
