import React, { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  LuUser,
  LuMail,
  LuLock,
  LuPhone,
  LuMapPin,
  LuCamera,
  LuSave,
  LuRotateCcw,
  LuShieldCheck,
  LuEye,
  LuEyeOff,
} from "react-icons/lu";

import {
  getStoredToken,
  getStoredUser,
  setAuthSession,
} from "../../../utils/auth";
import { resolveMediaUrl } from "../../../config/api";
import { ROUTES } from "../../../routes";
import { useHeader } from "../../../layout/LayoutContext";
import {
  useGetAdminProfileQuery,
  useUpdateAdminProfileMutation,
} from "../../../features/profile/profileApi";
import "../../../styles/ProfilePage.css";
import { FullScreenLoader } from "../../../components/common/FullScreenLoader";

interface AdminProfileData {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  profilePicture?: string;
  profile_picture?: string;
  profile_image?: string;
  profileImage?: string;
  avatar?: string;
}

export default function ProfilePage(): React.ReactElement {
  const { setHeaderConfig } = useHeader();
  const navigate = useNavigate();

  useEffect(() => {
    setHeaderConfig({
      title: "Admin Profile",
      subtitle: "Manage your personal account settings and credentials",
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
  } = useGetAdminProfileQuery(undefined, { skip: !token });

  const [updateProfile, { isLoading: isUpdating }] =
    useUpdateAdminProfileMutation();

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState("");

  // Sync RTK Query response with local form state
  useEffect(() => {
    if (profileResponse) {
      const raw = profileResponse as unknown as {
        data?: AdminProfileData;
      } & AdminProfileData;
      const profile: AdminProfileData = raw?.data ?? raw;

      setFullName(String(profile.fullName ?? ""));
      setEmail(String(profile.email ?? ""));
      setPhone(String(profile.phone ?? ""));
      setAddress(String(profile.address ?? ""));
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
    refetch();
    toast.info("Form reset", {
      description: "Reverted changes to match server state.",
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error("Validation Error", {
        description: "Full name and email are required fields.",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("fullName", fullName.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.trim());
      formData.append("address", address.trim());
      if (password.trim()) formData.append("password", password.trim());
      if (profileImageFile) {
        formData.append("profile_picture", profileImageFile);
      }

      // Execute RTK Mutation
      const res = await updateProfile(formData as any).unwrap();
      const updatedProfile: AdminProfileData =
        (res as unknown as { data?: AdminProfileData })?.data ??
        (res as unknown as AdminProfileData);

      // Keep user session in sync with updated values
      setAuthSession({
        ...currentUser,
        name: fullName.trim(),
        email: email.trim(),
        profilePicture:
          updatedProfile.profilePicture ??
          updatedProfile.profile_picture ??
          updatedProfile.profile_image ??
          updatedProfile.profileImage ??
          updatedProfile.avatar ??
          profileImage,
      });

      toast.success("Profile updated", {
        description: "Your profile information has been successfully updated.",
      });

      // Redirect to dashboard
      navigate(ROUTES.dashboard);
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      const errMsg =
        error?.data?.message || "Failed to update profile. Please try again.";
      toast.error("Update failed", {
        description: errMsg,
      });
    }
  };

  const isFormLoading = isLoading || isFetching;

  return (
    <div className="user-profile-container">
      {isFormLoading && !fullName ? (
        <FullScreenLoader
          title="Loading Admin Profile"
          subtitle="Retrieving your profile details..."
        />
      ) : (
        <form onSubmit={handleSubmit} className="user-profile-layout">
          {/* Left Column: Summary Card & Avatar Upload */}
          <div className="user-profile-side-card">
            <div className="user-profile-avatar-section">
              <div className="user-profile-avatar-wrapper">
                {profileImagePreviewUrl || profileImage ? (
                  <img
                    src={
                      profileImagePreviewUrl
                        ? profileImagePreviewUrl
                        : resolveMediaUrl(profileImage)
                    }
                    alt="Profile Avatar"
                    className="user-profile-avatar-img"
                  />
                ) : (
                  <div className="user-profile-avatar-fallback">
                    {fullName ? fullName.charAt(0).toUpperCase() : "A"}
                  </div>
                )}
                <label
                  htmlFor="userProfileImageInput"
                  className="user-profile-camera-btn"
                  title="Upload new photo"
                >
                  <LuCamera size={16} />
                </label>
                <input
                  id="userProfileImageInput"
                  type="file"
                  accept="image/*"
                  className="user-profile-hidden-file"
                  onChange={(e) =>
                    setProfileImageFile(e.target.files?.[0] ?? null)
                  }
                />
              </div>

              <h4 className="user-profile-card-name">
                {fullName || "Administrator"}
              </h4>
              <p className="user-profile-card-email">
                {email || "admin@domain.com"}
              </p>

              <div className="user-profile-role-badge">
                <LuShieldCheck size={14} />
                <span>Super Administrator</span>
              </div>

              {profileImagePreviewUrl && (
                <div className="user-profile-photo-alert">
                  New photo staged. Save to persist changes.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Edit Form Details */}
          <div className="user-profile-main-card">
            <div className="user-profile-header">
              <h3 className="user-profile-title">Account Details</h3>
              <p className="user-profile-subtitle">
                Update your identity details, email address, and security
                credentials.
              </p>
            </div>

            <div className="user-profile-form-grid">
              {/* Full Name */}
              <div className="user-profile-field">
                <label className="user-profile-label">
                  Full Name <span className="form-required-field">*</span>
                </label>
                <div className="user-profile-input-box">
                  <LuUser className="user-profile-field-icon" size={18} />
                  <input
                    type="text"
                    className="user-profile-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    maxLength={120}
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="user-profile-field">
                <label className="user-profile-label">
                  Email Address <span className="form-required-field">*</span>
                </label>
                <div className="user-profile-input-box">
                  <LuMail className="user-profile-field-icon" size={18} />
                  <input
                    type="email"
                    className="user-profile-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@domain.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="user-profile-field">
                <label className="user-profile-label">New Password</label>
                <div className="user-profile-input-box">
                  <LuLock className="user-profile-field-icon" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="user-profile-input user-profile-input-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep existing password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="user-profile-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "0 8px",
                      display: "flex",
                      alignItems: "center",
                      color: "inherit",
                      opacity: 0.7,
                    }}
                  >
                    {showPassword ? (
                      <LuEyeOff size={18} />
                    ) : (
                      <LuEye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div className="user-profile-field">
                <label className="user-profile-label">Phone Number</label>
                <div className="user-profile-input-box">
                  <LuPhone className="user-profile-field-icon" size={18} />
                  <input
                    type="text"
                    className="user-profile-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 555 123 4567"
                    maxLength={20}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="user-profile-field user-profile-field-full">
                <label className="user-profile-label">Physical Address</label>
                <div className="user-profile-input-box user-profile-textarea-box">
                  <LuMapPin
                    className="user-profile-field-icon-textarea"
                    size={18}
                  />
                  <textarea
                    className="user-profile-input user-profile-textarea"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 742 Evergreen Terrace, Springfield"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="user-profile-actions">
              <button
                type="button"
                className="user-profile-btn-secondary"
                onClick={handleReset}
                disabled={isUpdating}
              >
                <LuRotateCcw size={16} />
                <span>Reset</span>
              </button>
              <button
                type="submit"
                className="user-profile-btn-primary"
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
