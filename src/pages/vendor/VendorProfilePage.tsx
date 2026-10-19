import React, { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  LuUser,
  LuMail,
  LuLock,
  LuPhone,
  LuMapPin,
  // LuTag,
  // LuHash,
  LuCamera,
  LuSave,
  LuRotateCcw,
  LuStore,
  LuEye,
  LuEyeOff,
} from "react-icons/lu";

import {
  getStoredToken,
  getStoredUser,
  setAuthSession,
} from "../../utils/auth";
import { resolveMediaUrl } from "../../config/api";
import { ROUTES } from "../../routes";
import { useHeader } from "../../layout/LayoutContext";
import {
  useGetVendorProfileQuery,
  useUpdateVendorProfileMutation,
} from "../../features/profile/profileApi";
import "../../styles/Vendorprofilepage.css";
import { FullScreenLoader } from "../../components/common/FullScreenLoader";

interface VendorProfileData {
  fullName?: string;
  code?: string;
  email?: string;
  phone?: string;
  address?: string;
  gst_number?: string;
  profilePicture?: string;
  profile_picture?: string;
  profile_image?: string;
  profileImage?: string;
  avatar?: string;
}

export default function VendorProfilePage(): React.ReactElement {
  const { setHeaderConfig } = useHeader();
  const navigate = useNavigate();

  useEffect(() => {
    setHeaderConfig({
      title: "Vendor Profile",
      subtitle: "Manage your vendor account details and GST information",
    });
  }, [setHeaderConfig]);

  const token = getStoredToken();
  const currentUser = getStoredUser();

  // RTK Query Hooks
  const {
    data: profileResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetVendorProfileQuery(undefined, { skip: !token });

  const [updateProfile, { isLoading: isUpdating }] =
    useUpdateVendorProfileMutation();

  // Form State
  const [name, setName] = useState("");
  // const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  // const [gstNumber, setGstNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState("");

  // Sync RTK Query response with local form state
  useEffect(() => {
    if (profileResponse) {
      const raw = profileResponse as unknown as {
        data?: VendorProfileData;
      } & VendorProfileData;
      const profile: VendorProfileData = raw?.data ?? raw;

      setName(String(profile.fullName ?? ""));
      // setCode(String(profile.code ?? ""));
      setEmail(String(profile.email ?? ""));
      setPhone(String(profile.phone ?? ""));
      setAddress(String(profile.address ?? ""));
      // setGstNumber(String(profile.gst_number ?? ""));
      setProfileImage(
        String(
          profile.profilePicture ??
            profile.profile_picture ??
            profile.profile_image ??
            profile.profileImage ??
            profile.avatar ??
            "",
        ),
      );
      setProfileImageFile(null);
      setProfileImagePreviewUrl("");
    }
  }, [profileResponse]);

  // Object URL preview for file input
  useEffect(() => {
    if (!profileImageFile) {
      setProfileImagePreviewUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(profileImageFile);
    setProfileImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [profileImageFile]);

  if (!token || !currentUser) {
    return <Navigate to={ROUTES.login} replace />;
  }

  const handleReset = () => {
    setPassword("");
    setShowPassword(false);
    setProfileImageFile(null);
    setProfileImagePreviewUrl("");
    refetch();
    toast.info("Form reset", {
      description: "Reverted changes to match server state.",
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Validation Error", {
        description: "Name and email are required fields.",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.trim());
      formData.append("address", address.trim());
      // formData.append("gst_number", gstNumber.trim());
      // if (code.trim()) formData.append("code", code.trim());
      if (password.trim()) formData.append("password", password.trim());
      if (profileImageFile) {
        formData.append("profile_picture", profileImageFile);
      }

      const res = await updateProfile(formData as any).unwrap();
      const updatedProfile: VendorProfileData =
        (res as unknown as { data?: VendorProfileData })?.data ??
        (res as unknown as VendorProfileData);

      // Keep user session in sync
      setAuthSession({
        ...currentUser,
        name: String(updatedProfile?.fullName ?? name),
        email: String(updatedProfile?.email ?? email),
        profilePicture:
          updatedProfile.profilePicture ??
          updatedProfile.profile_picture ??
          updatedProfile.profile_image ??
          updatedProfile.profileImage ??
          updatedProfile.avatar ??
          profileImage,
      });

      setPassword("");
      setShowPassword(false);

      toast.success("Profile updated", {
        description: "Your vendor profile has been successfully updated.",
      });

      navigate(ROUTES.dashboard);
    } catch (error: any) {
      console.error("Failed to update vendor profile:", error);
      const errMsg =
        error?.data?.message || "Failed to update profile. Please try again.";
      toast.error("Update failed", {
        description: errMsg,
      });
    }
  };

  const isFormLoading = isLoading || isFetching;

  // Initials fallback for avatar
  const initials = name
    ? name
        .trim()
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "V";

  return (
    <div className="vendor-profile-container">
      {isFormLoading && !name ? (
        <FullScreenLoader
          title="Loading Vendor Profile"
          subtitle="Retrieving your profile details..."
        />
      ) : (
        <form onSubmit={handleSubmit} className="vendor-profile-layout">
          {/* Left Column: Summary Card & Avatar Upload */}
          <div className="vendor-profile-side-card">
            <div className="vendor-profile-avatar-section">
              <div className="vendor-profile-avatar-wrapper">
                {profileImagePreviewUrl || profileImage ? (
                  <img
                    src={
                      profileImagePreviewUrl
                        ? profileImagePreviewUrl
                        : resolveMediaUrl(profileImage)
                    }
                    alt="Profile Avatar"
                    className="vendor-profile-avatar-img"
                  />
                ) : (
                  <div className="vendor-profile-avatar-fallback">
                    {initials}
                  </div>
                )}
                <label
                  htmlFor="vendorProfileImageInput"
                  className="vendor-profile-camera-btn"
                  title="Upload new photo"
                >
                  <LuCamera size={16} />
                </label>
                <input
                  id="vendorProfileImageInput"
                  type="file"
                  accept="image/*"
                  className="vendor-profile-hidden-file"
                  onChange={(e) =>
                    setProfileImageFile(e.target.files?.[0] ?? null)
                  }
                />
              </div>

              <h4 className="vendor-profile-card-name">{name || "Vendor"}</h4>
              <p className="vendor-profile-card-email">
                {email || "vendor@domain.com"}
              </p>

              {/* {code && (
                <p className="vendor-profile-card-code">
                  Code: <strong>{code}</strong>
                </p>
              )} */}

              <div className="vendor-profile-role-badge">
                <LuStore size={14} />
                <span>Vendor Account</span>
              </div>

              {/* {gstNumber && (
                <div className="vendor-profile-gst-badge">
                  <LuHash size={12} />
                  <span>{gstNumber}</span>
                </div>
              )} */}

              {profileImagePreviewUrl && (
                <div className="vendor-profile-photo-alert">
                  New photo staged. Save to persist changes.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Edit Form */}
          <div className="vendor-profile-main-card">
            <div className="vendor-profile-header">
              <h3 className="vendor-profile-title">Account Details</h3>
              <p className="vendor-profile-subtitle">
                Update your business details, contact information, and GST
                credentials.
              </p>
            </div>

            <div className="vendor-profile-form-grid">
              {/* Name */}
              <div className="vendor-profile-field">
                <label className="vendor-profile-label">Name</label>
                <div className="vendor-profile-input-box">
                  <LuUser className="vendor-profile-field-icon" size={18} />
                  <input
                    type="text"
                    className="vendor-profile-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Supplies Pvt. Ltd."
                    maxLength={120}
                    required
                  />
                </div>
              </div>

              {/* Vendor Code */}
              {/* <div className="vendor-profile-field">
                <label className="vendor-profile-label">Vendor Code</label>
                <div className="vendor-profile-input-box">
                  <LuTag className="vendor-profile-field-icon" size={18} />
                  <input
                    type="text"
                    className="vendor-profile-input"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. VND-001"
                    maxLength={50}
                  />
                </div>
              </div> */}

              {/* Email */}
              <div className="vendor-profile-field">
                <label className="vendor-profile-label">Email Address</label>
                <div className="vendor-profile-input-box">
                  <LuMail className="vendor-profile-field-icon" size={18} />
                  <input
                    type="email"
                    className="vendor-profile-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. vendor@domain.com"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="vendor-profile-field">
                <label className="vendor-profile-label">Phone Number</label>
                <div className="vendor-profile-input-box">
                  <LuPhone className="vendor-profile-field-icon" size={18} />
                  <input
                    type="text"
                    className="vendor-profile-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    maxLength={20}
                  />
                </div>
              </div>

              {/* GST Number */}
              {/* <div className="vendor-profile-field">
                <label className="vendor-profile-label">GST Number</label>
                <div className="vendor-profile-input-box">
                  <LuHash className="vendor-profile-field-icon" size={18} />
                  <input
                    type="text"
                    className="vendor-profile-input"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    maxLength={15}
                  />
                </div>
              </div> */}

              {/* Password */}
              <div className="vendor-profile-field">
                <label className="vendor-profile-label">New Password</label>
                <div className="vendor-profile-input-box">
                  <LuLock className="vendor-profile-field-icon" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="vendor-profile-input vendor-profile-input-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep existing password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="vendor-profile-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <LuEyeOff size={18} />
                    ) : (
                      <LuEye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Address — full width */}
              <div className="vendor-profile-field vendor-profile-field-full">
                <label className="vendor-profile-label">Business Address</label>
                <div className="vendor-profile-input-box vendor-profile-textarea-box">
                  <LuMapPin
                    className="vendor-profile-field-icon-textarea"
                    size={18}
                  />
                  <textarea
                    className="vendor-profile-input vendor-profile-textarea"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 12 Industrial Area, Phase II, Chandigarh"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="vendor-profile-actions">
              <button
                type="button"
                className="vendor-profile-btn-secondary"
                onClick={handleReset}
                disabled={isUpdating}
              >
                <LuRotateCcw size={16} />
                <span>Reset</span>
              </button>
              <button
                type="submit"
                className="vendor-profile-btn-primary"
                disabled={isUpdating}
              >
                <LuSave size={16} />
                <span>{isUpdating ? "Saving changes..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
