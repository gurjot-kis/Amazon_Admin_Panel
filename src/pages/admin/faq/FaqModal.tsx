import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { MdClose, MdSave } from "react-icons/md";

import {
  useCreateFaqMutation,
  useGetFaqByIdQuery,
  useUpdateFaqMutation,
} from "../../../features/faq/faqApi";
import "../../../styles/faq/FaqModal.css";

interface FaqModalProps {
  isOpen: boolean;
  faqId?: string | null;
  onClose: () => void;
}

export const FaqModal: React.FC<FaqModalProps> = ({
  isOpen,
  faqId,
  onClose,
}) => {
  const isEditMode = Boolean(faqId);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [errors, setErrors] = useState<{ question?: string; answer?: string }>(
    {},
  );

  const { data: faqData, isLoading: isFetchingFaq } = useGetFaqByIdQuery(
    faqId as string,
    {
      skip: !isEditMode || !isOpen,
    },
  );

  const [createFaq, { isLoading: isCreating }] = useCreateFaqMutation();
  const [updateFaq, { isLoading: isUpdating }] = useUpdateFaqMutation();

  // Populate form if editing, or reset if adding
  useEffect(() => {
    if (!isOpen) {
      setQuestion("");
      setAnswer("");
      setErrors({});
      return;
    }

    if (isEditMode && faqData?.data) {
      setQuestion(faqData.data.question || "");
      setAnswer(faqData.data.answer || "");
    } else if (!isEditMode) {
      setQuestion("");
      setAnswer("");
      setErrors({});
    }
  }, [isOpen, isEditMode, faqData]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const validate = () => {
    const newErrors: { question?: string; answer?: string } = {};

    if (!question.trim()) {
      newErrors.question = "Question is required.";
    }
    if (!answer.trim()) {
      newErrors.answer = "Answer is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isEditMode && faqId) {
        await updateFaq({
          faqId,
          question: question.trim(),
          answer: answer.trim(),
        }).unwrap();

        toast.success("FAQ updated successfully");
      } else {
        await createFaq({
          question: question.trim(),
          answer: answer.trim(),
        }).unwrap();

        toast.success("FAQ added successfully");
      }

      onClose();
    } catch (err: any) {
      console.error("Failed to save FAQ:", err);
      toast.error(
        err?.data?.message || "Something went wrong. Please try again.",
      );
    }
  };

  if (!isOpen) return null;

  const isSaving = isCreating || isUpdating;

  return (
    <div className="faq-modal-overlay" onClick={onClose}>
      <div className="faq-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="faq-modal-header">
          <div>
            <h3 className="faq-modal-title">
              {isEditMode ? "Edit FAQ" : "Add New FAQ"}
            </h3>
            <p className="faq-modal-subtitle">
              {isEditMode
                ? "Update question and answer content."
                : "Create a new question and answer entry for users."}
            </p>
          </div>
          <button
            type="button"
            className="faq-modal-close-btn"
            onClick={onClose}
            title="Close"
          >
            <MdClose size={20} />
          </button>
        </div>

        {isFetchingFaq ? (
          <div className="text-center py-5">
            <div
              className="faq-spinner mx-auto mb-2"
              style={{
                width: 20,
                height: 20,
                borderColor: "#6366f1",
                borderTopColor: "transparent",
              }}
            ></div>
            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Loading FAQ details...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="faq-modal-body">
              <div className="faq-form-group">
                <label className="faq-form-label">
                  Question <span className="faq-req">*</span>
                </label>
                <input
                  type="text"
                  className={`faq-form-input ${
                    errors.question ? "faq-field--error" : ""
                  }`}
                  placeholder="e.g. How can I track my shipment?"
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                    if (errors.question) {
                      setErrors((prev) => ({ ...prev, question: undefined }));
                    }
                  }}
                  autoFocus
                />
                {errors.question && (
                  <div className="faq-error-text">{errors.question}</div>
                )}
              </div>

              <div className="faq-form-group">
                <label className="faq-form-label">
                  Answer <span className="faq-req">*</span>
                </label>
                <textarea
                  className={`faq-form-textarea ${
                    errors.answer ? "faq-field--error" : ""
                  }`}
                  placeholder="Provide a clear, helpful resolution..."
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    if (errors.answer) {
                      setErrors((prev) => ({ ...prev, answer: undefined }));
                    }
                  }}
                />
                {errors.answer && (
                  <div className="faq-error-text">{errors.answer}</div>
                )}
              </div>
            </div>

            <div className="faq-modal-footer">
              <button
                type="button"
                className="faq-btn-cancel"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="faq-btn-submit"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="faq-spinner"></div> Saving...
                  </>
                ) : (
                  <>
                    <MdSave size={16} />{" "}
                    {isEditMode ? "Save Changes" : "Add FAQ"}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
