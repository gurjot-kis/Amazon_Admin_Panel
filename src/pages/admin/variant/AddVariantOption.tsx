import React, { useEffect, useRef, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useGetVariantTypesQuery,
  useGetVariantOptionByIdQuery,
  useCreateVariantOptionMutation,
  useUpdateVariantOptionMutation,
} from "../../../features/variant/variantApi";
import { FullScreenLoader } from "../../../components/common/FullScreenLoader";
import "../../../styles/variant/AddVariantOption.css";
import { MdDelete } from "react-icons/md";

/* ── Types ─────────────────────────────────────────────── */
interface MetaEntry {
  id: string;
  key: string;
  value: string;
}

interface FormState {
  variant_type_id: string;
  value: string;
  label: string;
  meta: MetaEntry[];
}

const initialState: FormState = {
  variant_type_id: "",
  value: "",
  label: "",
  meta: [],
};

/* ── Helpers ───────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 9);

const metaArrayToObject = (entries: MetaEntry[]): Record<string, string> => {
  const obj: Record<string, string> = {};
  entries.forEach(({ key, value }) => {
    if (key.trim()) obj[key.trim()] = value;
  });
  return obj;
};

/* ── Spinner ───────────────────────────────────────────── */
const Spinner: React.FC = () => <span className="avo-spinner" aria-hidden />;

/* ── Component ─────────────────────────────────────────── */
const AddVariantOption: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(initialState);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const metaBottomRef = useRef<HTMLDivElement>(null);

  /* ── Queries ── */
  const { data: typesData, isLoading: typesLoading } = useGetVariantTypesQuery({
    limit: 100,
  });

  const { data: optionData, isLoading: optionLoading } =
    useGetVariantOptionByIdQuery(id as string, { skip: !isEditMode });

  const [createVariantOption, { isLoading: isCreating }] =
    useCreateVariantOptionMutation();
  const [updateVariantOption, { isLoading: isUpdating }] =
    useUpdateVariantOptionMutation();

  const isSubmitting = isCreating || isUpdating;

  const variantTypes = useMemo(() => typesData?.data ?? [], [typesData]);

  /* ── Populate on edit ── */
  useEffect(() => {
    if (!isEditMode || !optionData) return;
    const d = (optionData as any)?.data ?? optionData;
    const metaObj: Record<string, string> =
      d.meta instanceof Map
        ? Object.fromEntries(d.meta)
        : typeof d.meta === "object" && d.meta !== null
          ? d.meta
          : {};

    setForm({
      variant_type_id: d.variant_type_id?._id ?? d.variant_type_id ?? "",
      value: d.value ?? "",
      label: d.label ?? "",
      meta: Object.entries(metaObj).map(([key, value]) => ({
        id: uid(),
        key,
        value: String(value),
      })),
    });
  }, [isEditMode, optionData]);

  /* ── Validation ── */
  const errors = {
    variant_type_id:
      touched.variant_type_id && !form.variant_type_id
        ? "Please select a variant type."
        : "",
    value: touched.value && !form.value.trim() ? "Value is required." : "",
    label: touched.label && !form.label.trim() ? "Label is required." : "",
    meta: form.meta
      .map((entry) =>
        touched[`meta_key_${entry.id}`] && !entry.key.trim()
          ? "Key is required."
          : "",
      )
      .some(Boolean),
  };

  const isFormValid =
    !!form.variant_type_id &&
    !!form.value.trim() &&
    !!form.label.trim() &&
    form.meta.every((e) => e.key.trim());

  /* ── Meta handlers ── */
  const addMetaEntry = () => {
    setForm((prev) => ({
      ...prev,
      meta: [...prev.meta, { id: uid(), key: "", value: "" }],
    }));
    setTimeout(
      () => metaBottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  };

  const updateMeta = (entryId: string, field: "key" | "value", val: string) => {
    setForm((prev) => ({
      ...prev,
      meta: prev.meta.map((e) =>
        e.id === entryId ? { ...e, [field]: val } : e,
      ),
    }));
  };

  const removeMeta = (entryId: string) => {
    setForm((prev) => ({
      ...prev,
      meta: prev.meta.filter((e) => e.id !== entryId),
    }));
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      variant_type_id: true,
      value: true,
      label: true,
      ...Object.fromEntries(
        form.meta.flatMap((e) => [
          [`meta_key_${e.id}`, true],
          [`meta_val_${e.id}`, true],
        ]),
      ),
    });
    if (!isFormValid) return;

    const payload = {
      variant_type_id: form.variant_type_id,
      value: form.value.trim(),
      label: form.label.trim(),
      meta: metaArrayToObject(form.meta),
    };

    try {
      if (isEditMode && id) {
        await updateVariantOption({
          variantOptionId: id,
          data: payload,
        }).unwrap();
        toast.success("Variant option updated", {
          description: `"${payload.label}" has been updated successfully.`,
        });
      } else {
        await createVariantOption(payload).unwrap();
        toast.success("Variant option created", {
          description: `"${payload.label}" has been added.`,
        });
      }
      navigate("/admin/variant-option");
    } catch (err: any) {
      const msg =
        err?.data?.message || "Something went wrong. Please try again.";
      toast.error(isEditMode ? "Failed to update" : "Failed to create", {
        description: msg,
      });
    }
  };

  const handleCancel = () => navigate("/admin/variant-option");

  /* ── Full screen loader for edit fetch ── */
  if (isEditMode && optionLoading) {
    return (
      <FullScreenLoader
        title="Loading Option"
        subtitle="Retrieving variant option details..."
      />
    );
  }

  /* ── Selected type for preview ── */
  const selectedType = variantTypes.find((t) => t._id === form.variant_type_id);
  const isColorType = selectedType?.slug === "color";

  return (
    <div className="avo-page">
      <div className="container-fluid avo-container">
        {/* Header */}
        <div className="avo-header">
          <div>
            <p className="avo-eyebrow">Variant Manager</p>
            <h1 className="avo-title">
              {isEditMode ? "Edit Variant Option" : "Add Variant Option"}
            </h1>
            <p className="avo-subtitle">
              {isEditMode
                ? "Update the details of this variant option."
                : "Create a new option and assign it to a variant type."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <fieldset className="avo-fieldset" disabled={isSubmitting}>
            <div className="row g-4 avo-body">
              {/* ── Left column ── */}
              <div className="col-12 col-lg-8">
                {/* Card 01 — Core details */}
                <section className="avo-card">
                  <header className="avo-card-header">
                    <span className="avo-card-index">01</span>
                    <div>
                      <h2>Option details</h2>
                      <p>
                        The internal value and the display label shown to
                        customers.
                      </p>
                    </div>
                  </header>

                  {/* Variant Type */}
                  <div className="avo-field">
                    <label htmlFor="avo-type">Variant type</label>
                    <div className="avo-select-wrap">
                      <select
                        id="avo-type"
                        className={`avo-select${errors.variant_type_id ? " is-invalid" : ""}`}
                        value={form.variant_type_id}
                        disabled={typesLoading}
                        onChange={(e) => {
                          setForm((p) => ({
                            ...p,
                            variant_type_id: e.target.value,
                          }));
                          setTouched((t) => ({ ...t, variant_type_id: true }));
                        }}
                        onBlur={() =>
                          setTouched((t) => ({ ...t, variant_type_id: true }))
                        }
                      >
                        <option value="">
                          {typesLoading
                            ? "Loading types…"
                            : "Select a variant type"}
                        </option>
                        {variantTypes.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <span className="avo-select-chevron" aria-hidden>
                        ▾
                      </span>
                    </div>
                    {errors.variant_type_id && (
                      <div className="avo-error">{errors.variant_type_id}</div>
                    )}
                  </div>

                  {/* Value + Label side by side */}
                  <div className="avo-row-2">
                    <div className="avo-field">
                      <label htmlFor="avo-value">Value</label>
                      <div className="avo-input-wrap">
                        {isColorType && form.value && (
                          <span
                            className="avo-color-dot"
                            style={{ background: form.value }}
                          />
                        )}
                        <input
                          id="avo-value"
                          type="text"
                          className={`avo-input${isColorType && form.value ? " avo-input--has-dot" : ""}${errors.value ? " is-invalid" : ""}`}
                          placeholder={
                            isColorType
                              ? "e.g. red, #FF0000"
                              : "e.g. S, XL, 500ml"
                          }
                          value={form.value}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, value: e.target.value }))
                          }
                          onBlur={() =>
                            setTouched((t) => ({ ...t, value: true }))
                          }
                        />
                      </div>
                      {errors.value && (
                        <div className="avo-error">{errors.value}</div>
                      )}
                      <p className="avo-hint">
                        Internal identifier — used in filters and logic.
                      </p>
                    </div>

                    <div className="avo-field">
                      <label htmlFor="avo-label">Label</label>
                      <input
                        id="avo-label"
                        type="text"
                        className={`avo-input${errors.label ? " is-invalid" : ""}`}
                        placeholder="e.g. Small, Extra Large, Red"
                        value={form.label}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, label: e.target.value }))
                        }
                        onBlur={() =>
                          setTouched((t) => ({ ...t, label: true }))
                        }
                      />
                      {errors.label && (
                        <div className="avo-error">{errors.label}</div>
                      )}
                      <p className="avo-hint">
                        Display name shown to customers.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Card 02 — Meta */}
                <section className="avo-card">
                  <header className="avo-card-header">
                    <span className="avo-card-index">02</span>
                    <div>
                      <h2>Meta attributes</h2>
                      <p>
                        Optional key-value pairs — e.g. <code>hex: FF0000</code>
                        , <code>height: 50cm</code>.
                      </p>
                    </div>
                  </header>

                  {form.meta.length === 0 && (
                    <div className="avo-meta-empty">
                      <span className="avo-meta-empty-icon">⊞</span>
                      <p>No attributes yet. Add one below.</p>
                    </div>
                  )}

                  <div className="avo-meta-list">
                    {form.meta.map((entry, idx) => (
                      <div key={entry.id} className="avo-meta-row">
                        <span className="avo-meta-idx">{idx + 1}</span>

                        <div className="avo-meta-fields">
                          <div className="avo-field">
                            {idx === 0 && (
                              <label className="avo-meta-col-label">Key</label>
                            )}
                            <input
                              type="text"
                              className={`avo-input avo-input--sm${
                                touched[`meta_key_${entry.id}`] &&
                                !entry.key.trim()
                                  ? " is-invalid"
                                  : ""
                              }`}
                              placeholder="e.g. hex, height"
                              value={entry.key}
                              onChange={(e) =>
                                updateMeta(entry.id, "key", e.target.value)
                              }
                              onBlur={() =>
                                setTouched((t) => ({
                                  ...t,
                                  [`meta_key_${entry.id}`]: true,
                                }))
                              }
                            />
                            {touched[`meta_key_${entry.id}`] &&
                              !entry.key.trim() && (
                                <div className="avo-error">
                                  Key is required.
                                </div>
                              )}
                          </div>

                          <div className="avo-field">
                            {idx === 0 && (
                              <label className="avo-meta-col-label">
                                Value
                              </label>
                            )}
                            <div className="avo-input-wrap">
                              {entry.key === "hex" && entry.value && (
                                <span
                                  className="avo-color-dot"
                                  style={{ background: `#${entry.value}` }}
                                />
                              )}
                              <input
                                type="text"
                                className={`avo-input avo-input--sm${
                                  entry.key === "hex" && entry.value
                                    ? " avo-input--has-dot"
                                    : ""
                                } avo-input--with-picker`}
                                placeholder={
                                  entry.key === "hex"
                                    ? "e.g. FF0000"
                                    : "e.g. 50cm"
                                }
                                value={entry.value}
                                onChange={(e) =>
                                  updateMeta(entry.id, "value", e.target.value)
                                }
                              />
                              {entry.key === "hex" && (
                                <label
                                  className="avo-color-picker-btn"
                                  title="Pick a color"
                                >
                                  <input
                                    type="color"
                                    className="avo-color-picker-input"
                                    value={
                                      entry.value &&
                                      /^[0-9a-fA-F]{6}$/.test(entry.value)
                                        ? `#${entry.value}`
                                        : "#000000"
                                    }
                                    onChange={(e) =>
                                      updateMeta(
                                        entry.id,
                                        "value",
                                        e.target.value.slice(1).toUpperCase(),
                                      )
                                    }
                                  />
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden
                                  >
                                    <path
                                      d="M20.71 5.63l-2.34-2.34a1 1 0 0 0-1.41 0l-3.12 3.12-1.41-1.42-1.42 1.42 1.41 1.41-6.6 6.6A2 2 0 0 0 5 16v3h3a2 2 0 0 0 1.42-.59l6.6-6.6 1.41 1.42 1.42-1.42-1.42-1.41 3.12-3.12a1 1 0 0 0 0-1.65z"
                                      stroke="currentColor"
                                      strokeWidth="1.6"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </label>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="avo-meta-remove"
                          onClick={() => removeMeta(entry.id)}
                          title="Remove"
                        >
                          <MdDelete size={20} />
                        </button>
                      </div>
                    ))}
                    <div ref={metaBottomRef} />
                  </div>

                  <button
                    type="button"
                    className="avo-add-meta-btn"
                    onClick={addMetaEntry}
                  >
                    <span className="avo-add-meta-plus">+</span>
                    Add attribute
                  </button>
                </section>

                {/* Actions */}
                <div className="avo-actions">
                  <button
                    type="button"
                    className="btn avo-btn-ghost"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn avo-btn-primary"
                    disabled={!isFormValid || isSubmitting}
                  >
                    {isSubmitting && <Spinner />}
                    {isSubmitting
                      ? isEditMode
                        ? "Updating…"
                        : "Creating…"
                      : isEditMode
                        ? "Update option"
                        : "Create option"}
                  </button>
                </div>
              </div>

              {/* ── Right column — Live preview ── */}
              <div className="col-12 col-lg-4">
                <div className="avo-sticky">
                  <div className="avo-preview-card">
                    <p className="avo-preview-label">Live preview</p>

                    <div className="avo-preview-tile">
                      {/* Color swatch for color types */}
                      {isColorType ? (
                        <div className="avo-preview-swatch-wrap">
                          <div
                            className="avo-preview-swatch"
                            style={{ background: form.value || "#e2e8f0" }}
                          />
                        </div>
                      ) : (
                        <div className="avo-preview-icon-wrap">
                          <span className="avo-preview-icon">⬡</span>
                        </div>
                      )}

                      <div className="avo-preview-body">
                        <p className="avo-preview-label-text">
                          {form.label || (
                            <span className="avo-preview-placeholder">
                              Label
                            </span>
                          )}
                        </p>
                        <p className="avo-preview-value">
                          value: <code>{form.value || "—"}</code>
                        </p>
                        {selectedType && (
                          <span className="avo-preview-type-tag">
                            {selectedType.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta preview */}
                    {form.meta.filter((e) => e.key.trim()).length > 0 && (
                      <div className="avo-preview-meta">
                        <p className="avo-preview-meta-title">Meta</p>
                        <div className="avo-preview-meta-grid">
                          {form.meta
                            .filter((e) => e.key.trim())
                            .map((e) => (
                              <div key={e.id} className="avo-preview-meta-row">
                                {e.key === "hex" && e.value ? (
                                  <>
                                    <span
                                      className="avo-preview-color-dot"
                                      style={{ background: `#${e.value}` }}
                                    />
                                    <span className="avo-preview-meta-key">
                                      {e.key}
                                    </span>
                                    <span className="avo-preview-meta-val avo-preview-meta-val--mono">
                                      #{e.value}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="avo-preview-meta-key">
                                      {e.key}
                                    </span>
                                    <span className="avo-preview-meta-val">
                                      {e.value || "—"}
                                    </span>
                                  </>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payload preview */}
                  <div className="avo-payload-card">
                    <p className="avo-preview-label">Payload preview</p>
                    <pre className="avo-payload-pre">
                      {JSON.stringify(
                        {
                          variant_type_id: form.variant_type_id || "—",
                          value: form.value || "—",
                          label: form.label || "—",
                          meta: metaArrayToObject(form.meta),
                        },
                        null,
                        2,
                      )}
                    </pre>
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

export default AddVariantOption;
