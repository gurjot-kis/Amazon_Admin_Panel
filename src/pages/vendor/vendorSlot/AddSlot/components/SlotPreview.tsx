import React from "react";
import { HiCalendar, HiClock, HiLocationMarker, HiTag } from "react-icons/hi";
import type { SlotFormState, PreLeafCategory } from "../utils/addSlotTypes";
import { minutesOf } from "../utils/addSlotUtils";

interface SlotPreviewProps {
  form: SlotFormState;
  selectedCategory: PreLeafCategory | undefined;
}

const SlotPreview: React.FC<SlotPreviewProps> = ({
  form,
  selectedCategory,
}) => {
  // Use the updated minutesOf (which handles AM/PM and 24-hr formats)
  const startMin = form.startTime ? minutesOf(form.startTime) : 0;
  const endMin = form.endTime ? minutesOf(form.endTime) : 0;
  const slotDuration =
    startMin > 0 && endMin > startMin ? endMin - startMin : 0;

  return (
    <div className="as-sticky">
      <div className="as-preview-card">
        <p className="as-preview-label">Live Preview</p>
        <div className="as-preview-body">
          <div className="as-preview-row">
            <div className="as-preview-row-icon">
              <HiTag size={14} />
            </div>
            <div>
              <p className="as-preview-meta">Category</p>
              <p className="as-preview-value">
                {selectedCategory?.name ?? (
                  <span className="as-preview-empty">Not selected</span>
                )}
              </p>
              {selectedCategory?.parentName && (
                <p className="as-preview-sub">{selectedCategory.parentName}</p>
              )}
            </div>
          </div>

          <div className="as-preview-divider" />

          <div className="as-preview-row">
            <div className="as-preview-row-icon">
              <HiCalendar size={14} />
            </div>
            <div>
              <p className="as-preview-meta">Date</p>
              <p className="as-preview-value">
                {form.date ? (
                  new Date(form.date + "T00:00:00").toLocaleDateString(
                    "en-IN",
                    {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  )
                ) : (
                  <span className="as-preview-empty">Not set</span>
                )}
              </p>
            </div>
          </div>

          <div className="as-preview-divider" />

          <div className="as-preview-row">
            <div className="as-preview-row-icon">
              <HiClock size={14} />
            </div>
            <div>
              <p className="as-preview-meta">Time Window</p>
              {form.startTime && form.endTime ? (
                <p className="as-preview-value">
                  {form.startTime} – {form.endTime}
                </p>
              ) : (
                <p className="as-preview-empty">Not set</p>
              )}
              {slotDuration > 0 && (
                <span className="as-preview-badge">{slotDuration} min</span>
              )}
            </div>
          </div>

          <div className="as-preview-divider" />

          <div className="as-preview-row">
            <div className="as-preview-row-icon">
              <HiLocationMarker size={14} />
            </div>
            <div>
              <p className="as-preview-meta">Coordinates</p>
              {form.longitude && form.latitude ? (
                <p className="as-preview-coords">
                  [{parseFloat(form.longitude).toFixed(4)},{" "}
                  {parseFloat(form.latitude).toFixed(4)}]
                </p>
              ) : (
                <p className="as-preview-empty">Not set</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* <div className="as-payload-card">
        <p className="as-preview-label">Request Payload</p>
        <pre className="as-payload-pre">
          {JSON.stringify(
            {
              category_id: form.category_id || "—",
              date: form.date || "—",
              startTime: form.startTime || "—",
              endTime: form.endTime || "—",
              location: {
                coordinates: [
                  form.longitude ? parseFloat(form.longitude) : "—",
                  form.latitude ? parseFloat(form.latitude) : "—",
                ],
              },
            },
            null,
            2,
          )}
        </pre>
      </div> */}
    </div>
  );
};

export default SlotPreview;
