import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  HiArrowLeft,
  HiCalendar,
  HiCheckCircle,
  HiLocationMarker,
  HiTag,
} from "react-icons/hi";
import { useGetActiveCategoriesQuery } from "../../../../features/category/categoryApi";
import { collectPreLeafCategories } from "./utils/addSlotUtils";
import { useAddSlotForm } from "./hooks/useAddSlotForm";
import DatePicker from "./components/DatePicker";
import TimePicker from "./components/TimePicker";
import CategorySelect from "./components/CategorySelect";
import TimeRangeBar from "./components/TimeRangeBar";
import SlotPreview from "./components/SlotPreview";
import StepBadge from "./components/StepBadge";
import Spinner from "./components/Spinner";
import "../../../../styles/vendor/AddSlot.css";
import { FullScreenLoader } from "../../../../components/common/FullScreenLoader";

const AddSlot: React.FC = () => {
  const navigate = useNavigate();
  const { slotId } = useParams<{ slotId?: string }>();

  const {
    form,
    errors,
    isEditMode,
    isSubmitting,
    isSlotLoading,
    isSlotError,
    isFormValid,
    step1Done,
    step2Done,
    step3Done,
    setField,
    markTouched,
    handleSubmit,
  } = useAddSlotForm(slotId);

  const {
    data: categoriesRes,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useGetActiveCategoriesQuery();

  const categoryOptions = useMemo(
    () => collectPreLeafCategories(categoriesRes?.data ?? []),
    [categoriesRes],
  );

  const selectedCategory = categoryOptions.find(
    (o) => o._id === form.category_id,
  );

  if (isSlotLoading) {
    return (
      <div className="as-page flex items-center justify-center p-8">
        <FullScreenLoader
          title="Loading slot details…"
          subtitle="Please wait while we load the slot details."
        />
      </div>
    );
  }

  if (isSlotError) {
    return (
      <div className="as-page p-8">
        <p className="as-field-error">Failed to load slot details.</p>
        <button
          type="button"
          className="as-btn-ghost mt-4"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="as-page">
      <div className="as-container">
        {/* Header */}
        <div className="as-header">
          <button
            type="button"
            className="as-back-btn"
            onClick={() => navigate(-1)}
          >
            <HiArrowLeft size={16} />
            Back to Slots
          </button>
          <div className="as-header-content">
            <div>
              <p className="as-eyebrow">Vendor Management</p>
              <h1 className="as-title">
                {isEditMode
                  ? "Edit Availability Slot"
                  : "Add Availability Slot"}
              </h1>
              <p className="as-subtitle">
                {isEditMode
                  ? "Update your existing availability slot settings."
                  : "Define a time window when the vendor is available for bookings."}
              </p>
            </div>
            <div className="as-progress-pills">
              <div className={`as-pill ${step1Done ? "done" : ""}`}>
                <StepBadge n={1} done={step1Done} /> Category
              </div>
              <div className="as-pill-connector" />
              <div className={`as-pill ${step2Done ? "done" : ""}`}>
                <StepBadge n={2} done={step2Done} /> Schedule
              </div>
              <div className="as-pill-connector" />
              <div className={`as-pill ${step3Done ? "done" : ""}`}>
                <StepBadge n={3} done={step3Done} /> Location
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <fieldset className="as-fieldset" disabled={isSubmitting}>
            <div className="as-layout">
              {/* LEFT — Form */}
              <div className="as-form-col">
                {/* 01 Category */}
                <div className="as-card">
                  <div className="as-card-header">
                    <div
                      className="as-card-icon-wrap"
                      style={{ "--icon-hue": "262deg" } as React.CSSProperties}
                    >
                      <HiTag size={18} />
                    </div>
                    <div>
                      <h2 className="as-card-title">Service Category</h2>
                      <p className="as-card-desc">
                        Which service does this slot cover?
                      </p>
                    </div>
                  </div>
                  <div className="as-field">
                    <label className="as-label">Category</label>
                    <CategorySelect
                      options={categoryOptions}
                      value={form.category_id}
                      onChange={(id) => {
                        setField("category_id", id);
                        markTouched("category_id");
                      }}
                      loading={categoriesLoading}
                      errored={categoriesError}
                      invalid={!!errors.category_id}
                    />
                    {errors.category_id && (
                      <p className="as-field-error">{errors.category_id}</p>
                    )}
                  </div>
                </div>

                {/* 02 Schedule */}
                <div className="as-card">
                  <div className="as-card-header">
                    <div
                      className="as-card-icon-wrap"
                      style={{ "--icon-hue": "220deg" } as React.CSSProperties}
                    >
                      <HiCalendar size={18} />
                    </div>
                    <div>
                      <h2 className="as-card-title">Schedule</h2>
                      <p className="as-card-desc">
                        Set the date and time window for this slot.
                      </p>
                    </div>
                  </div>
                  <div className="as-field">
                    <label className="as-label">Date</label>
                    <DatePicker
                      value={form.date}
                      min={
                        isEditMode
                          ? undefined
                          : new Date().toISOString().split("T")[0]
                      }
                      invalid={!!errors.date}
                      onChange={(v) => setField("date", v)}
                      onBlur={() => markTouched("date")}
                    />
                    {errors.date && (
                      <p className="as-field-error">{errors.date}</p>
                    )}
                  </div>
                  <div className="as-row-2">
                    <div className="as-field">
                      <label className="as-label">Start Time</label>
                      <TimePicker
                        value={form.startTime}
                        invalid={!!errors.startTime}
                        placeholder="Start time"
                        onChange={(v) => setField("startTime", v)}
                        onBlur={() => markTouched("startTime")}
                      />
                      {errors.startTime && (
                        <p className="as-field-error">{errors.startTime}</p>
                      )}
                    </div>
                    <div className="as-field">
                      <label className="as-label">End Time</label>
                      <TimePicker
                        value={form.endTime}
                        invalid={!!errors.endTime}
                        placeholder="End time"
                        onChange={(v) => setField("endTime", v)}
                        onBlur={() => markTouched("endTime")}
                      />
                      {errors.endTime && (
                        <p className="as-field-error">{errors.endTime}</p>
                      )}
                    </div>
                  </div>
                  <TimeRangeBar start={form.startTime} end={form.endTime} />
                </div>

                {/* 03 Location */}
                <div className="as-card">
                  <div className="as-card-header">
                    <div
                      className="as-card-icon-wrap"
                      style={{ "--icon-hue": "160deg" } as React.CSSProperties}
                    >
                      <HiLocationMarker size={18} />
                    </div>
                    <div>
                      <h2 className="as-card-title">Location Coordinates</h2>
                      <p className="as-card-desc">
                        Geographic point for this slot (GeoJSON: longitude
                        first).
                      </p>
                    </div>
                  </div>
                  <div className="as-row-2">
                    <div className="as-field">
                      <label className="as-label">
                        Longitude{" "}
                        <span className="as-label-badge">−180 to 180</span>
                      </label>
                      <div className="as-coord-wrap">
                        <span className="as-coord-prefix">LNG</span>
                        <input
                          type="number"
                          step="any"
                          min="-180"
                          max="180"
                          className={`as-input as-input-coord ${errors.longitude ? "is-invalid" : ""}`}
                          placeholder="76.7352"
                          value={form.longitude}
                          onChange={(e) =>
                            setField("longitude", e.target.value)
                          }
                          onBlur={() => markTouched("longitude")}
                        />
                      </div>
                      {errors.longitude && (
                        <p className="as-field-error">{errors.longitude}</p>
                      )}
                    </div>
                    <div className="as-field">
                      <label className="as-label">
                        Latitude{" "}
                        <span className="as-label-badge">−90 to 90</span>
                      </label>
                      <div className="as-coord-wrap">
                        <span className="as-coord-prefix">LAT</span>
                        <input
                          type="number"
                          step="any"
                          min="-90"
                          max="90"
                          className={`as-input as-input-coord ${errors.latitude ? "is-invalid" : ""}`}
                          placeholder="30.6947"
                          value={form.latitude}
                          onChange={(e) => setField("latitude", e.target.value)}
                          onBlur={() => markTouched("latitude")}
                        />
                      </div>
                      {errors.latitude && (
                        <p className="as-field-error">{errors.latitude}</p>
                      )}
                    </div>
                  </div>
                  {form.longitude &&
                    form.latitude &&
                    !errors.longitude &&
                    !errors.latitude && (
                      <div className="as-coord-preview">
                        <HiCheckCircle size={15} className="as-coord-check" />
                        <span className="as-coord-text">
                          {parseFloat(form.latitude).toFixed(4)}° N,{" "}
                          {parseFloat(form.longitude).toFixed(4)}° E
                        </span>
                      </div>
                    )}
                </div>

                {/* Actions */}
                <div className="as-actions">
                  <button
                    type="button"
                    className="as-btn-ghost"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="as-btn-primary"
                    disabled={!isFormValid || isSubmitting}
                  >
                    {isSubmitting && <Spinner />}
                    {isSubmitting
                      ? isEditMode
                        ? "Updating…"
                        : "Creating…"
                      : isEditMode
                        ? "Update Slot"
                        : "Create Slot"}
                  </button>
                </div>
              </div>

              {/* RIGHT — Preview */}
              <div className="as-preview-col">
                <SlotPreview form={form} selectedCategory={selectedCategory} />
              </div>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
};

export default AddSlot;
