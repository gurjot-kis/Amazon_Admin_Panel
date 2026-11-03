import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useGetWalletSettingsByIdQuery,
  useCreateWalletSettingsMutation,
  useUpdateWalletSettingsMutation,
} from "../../../features/wallet/walletSettingsApi";
import { useHeader } from "../../../layout/LayoutContext";
import { MdAdd, MdClose, MdArrowBack } from "react-icons/md";
import "../../../styles/wallet/WalletSettingsForm.css";
import { FullScreenLoader } from "../../../components/common/FullScreenLoader";

interface FormData {
  min_topup: number | "";
  max_topup: number | "";
  max_balance: number | "";
  quick_topup_amounts: number[];
  enabled: boolean;
}

// Form initial state holds RUPEE values
const initialForm: FormData = {
  min_topup: 50, // ₹50 -> 5,000 paise
  max_topup: 10000, // ₹10,000 -> 1,000,000 paise
  max_balance: 50000, // ₹50,000 -> 5,000,000 paise
  quick_topup_amounts: [500, 1000, 2000, 5000], // ₹500, ₹1000, etc.
  enabled: true,
};

// Conversions
const paiseToRupees = (paise: number) => Math.round(paise) / 100;
const rupeesToPaise = (rupees: number) => Math.round(rupees * 100);

const AddWalletSettings = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { setHeaderConfig } = useHeader();

  const [formData, setFormData] = useState<FormData>(initialForm);
  const [quickInput, setQuickInput] = useState<string>("");

  useEffect(() => {
    setHeaderConfig({
      title: isEditMode ? "Edit Wallet Setting" : "Add Wallet Setting",
    });
  }, [setHeaderConfig, isEditMode]);

  const {
    data: settingResponse,
    isLoading: isFetchingData,
    isError: isFetchError,
  } = useGetWalletSettingsByIdQuery(id as string, {
    skip: !isEditMode,
  });

  const [createWalletSettings, { isLoading: isCreating }] =
    useCreateWalletSettingsMutation();
  const [updateWalletSettings, { isLoading: isUpdating }] =
    useUpdateWalletSettingsMutation();

  const isSubmitting = isCreating || isUpdating;

  // Convert paise from backend -> Rupees for form fields
  useEffect(() => {
    if (isEditMode && settingResponse?.data) {
      const s = settingResponse.data;
      setFormData({
        min_topup: paiseToRupees(s.min_topup),
        max_topup: paiseToRupees(s.max_topup),
        max_balance: paiseToRupees(s.max_balance),
        quick_topup_amounts: (s.quick_topup_amounts || []).map(paiseToRupees),
        enabled: s.enabled,
      });
    }
  }, [isEditMode, settingResponse]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : Number(value),
      }));
    }
  };

  const handleAddQuickAmount = () => {
    const val = Number(quickInput);
    if (!val || val <= 0) return;

    if (formData.quick_topup_amounts.includes(val)) {
      toast.warning("This amount is already added");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      quick_topup_amounts: [...prev.quick_topup_amounts, val].sort(
        (a, b) => a - b,
      ),
    }));
    setQuickInput("");
  };

  const handleRemoveQuickAmount = (amountToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      quick_topup_amounts: prev.quick_topup_amounts.filter(
        (amt) => amt !== amountToRemove,
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const minRupees = Number(formData.min_topup);
    const maxRupees = Number(formData.max_topup);
    const balanceRupees = Number(formData.max_balance);

    if (minRupees <= 0 || maxRupees <= 0 || balanceRupees <= 0) {
      toast.error("All limits must be greater than ₹0");
      return;
    }

    if (minRupees >= maxRupees) {
      toast.error(
        "Minimum top-up cannot be greater than or equal to maximum top-up",
      );
      return;
    }

    if (maxRupees > balanceRupees) {
      toast.error("Maximum top-up cannot exceed maximum wallet balance");
      return;
    }

    // Convert Rupees -> Paise for payload
    const payload = {
      min_topup: rupeesToPaise(minRupees),
      max_topup: rupeesToPaise(maxRupees),
      max_balance: rupeesToPaise(balanceRupees),
      quick_topup_amounts: formData.quick_topup_amounts.map(rupeesToPaise),
      enabled: formData.enabled,
    };

    try {
      if (isEditMode && id) {
        await updateWalletSettings({
          walletSettingsId: id,
          data: payload,
        }).unwrap();
        toast.success("Wallet settings updated successfully");
      } else {
        await createWalletSettings(payload).unwrap();
        toast.success("Wallet settings created successfully");
      }
      navigate("/admin/wallet-settings");
    } catch (err: any) {
      toast.error(
        err?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} wallet settings`,
      );
    }
  };

  if (isEditMode && isFetchingData) {
    return (
      <FullScreenLoader
        title="Loading Wallet Settings"
        subtitle="Retrieving wallet configuration and settings..."
      />
    );
  }

  if (isEditMode && isFetchError) {
    return (
      <div className="ws-form-card">
        <div className="ws-form-error">
          <p>Failed to load this wallet configuration.</p>
          <button
            type="button"
            className="ws-btn ws-btn-secondary"
            onClick={() => navigate("/admin/wallet-settings")}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ws-form-page">
      <div className="ws-form-header">
        <button
          type="button"
          className="ws-back-btn"
          onClick={() => navigate("/admin/wallet-settings")}
        >
          <MdArrowBack size={20} />
          <span>Back to Settings</span>
        </button>
      </div>

      <div className="ws-form-card">
        <div className="ws-card-header">
          <h2 className="ws-card-title">
            {isEditMode ? "Edit Configuration" : "New Configuration"}
          </h2>
          <p className="ws-card-subtitle">
            Amounts are entered in Rupees (₹) and automatically synced in paise.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="ws-form">
          <div className="ws-grid">
            {/* Min Top-up in Rupees */}
            <div className="ws-field-group">
              <label htmlFor="min_topup" className="ws-label">
                Minimum Top-up (₹) <span className="ws-required">*</span>
              </label>
              <input
                id="min_topup"
                type="number"
                name="min_topup"
                value={formData.min_topup}
                onChange={handleInputChange}
                className="ws-input"
                placeholder="e.g. 50"
                min="1"
                step="any"
                required
              />
            </div>

            {/* Max Top-up in Rupees */}
            <div className="ws-field-group">
              <label htmlFor="max_topup" className="ws-label">
                Maximum Top-up (₹) <span className="ws-required">*</span>
              </label>
              <input
                id="max_topup"
                type="number"
                name="max_topup"
                value={formData.max_topup}
                onChange={handleInputChange}
                className="ws-input"
                placeholder="e.g. 10000"
                min="1"
                step="any"
                required
              />
            </div>

            {/* Max Wallet Balance in Rupees */}
            <div className="ws-field-group ws-grid-full">
              <label htmlFor="max_balance" className="ws-label">
                Maximum Balance Cap (₹) <span className="ws-required">*</span>
              </label>
              <input
                id="max_balance"
                type="number"
                name="max_balance"
                value={formData.max_balance}
                onChange={handleInputChange}
                className="ws-input"
                placeholder="e.g. 50000"
                min="1"
                step="any"
                required
              />
            </div>
          </div>

          {/* Quick Preset Amounts in Rupees */}
          <div className="ws-field-group ws-quick-section">
            <label className="ws-label">Quick Preset Amounts (₹)</label>
            <div className="ws-quick-input-row">
              <input
                type="number"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddQuickAmount();
                  }
                }}
                className="ws-input ws-quick-input"
                placeholder="Enter amount in ₹ (e.g. 500)"
                min="1"
              />
              <button
                type="button"
                className="ws-btn ws-btn-secondary"
                onClick={handleAddQuickAmount}
              >
                <MdAdd size={18} />
                <span>Add Preset</span>
              </button>
            </div>

            <div className="ws-chips-container">
              {formData.quick_topup_amounts.length > 0 ? (
                formData.quick_topup_amounts.map((amount) => (
                  <span key={amount} className="ws-chip">
                    ₹{amount.toLocaleString("en-IN")}
                    <button
                      type="button"
                      className="ws-chip-remove"
                      onClick={() => handleRemoveQuickAmount(amount)}
                      title="Remove amount"
                    >
                      <MdClose size={14} />
                    </button>
                  </span>
                ))
              ) : (
                <span className="ws-field-hint">No presets added yet.</span>
              )}
            </div>
          </div>

          {/* Status Toggle */}
          <div className="ws-switch-row">
            <div>
              <span className="ws-switch-label">Enable Configuration</span>
              <p className="ws-switch-desc">
                Enable or disable this configuration rule immediately.
              </p>
            </div>
            <label className="ws-switch">
              <input
                type="checkbox"
                name="enabled"
                checked={formData.enabled}
                onChange={handleInputChange}
              />
              <span className="ws-slider" />
            </label>
          </div>

          {/* Form Actions */}
          <div className="ws-form-actions">
            <button
              type="button"
              className="ws-btn ws-btn-secondary"
              onClick={() => navigate("/admin/wallet-settings")}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ws-btn ws-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="ws-spinner ws-spinner-sm" />
                  <span>{isEditMode ? "Updating..." : "Saving..."}</span>
                </>
              ) : isEditMode ? (
                "Update Configuration"
              ) : (
                "Save Configuration"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWalletSettings;
