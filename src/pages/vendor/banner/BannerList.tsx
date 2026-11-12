import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  MdDelete,
  MdModeEdit,
  MdImage,
  MdSmartphone,
  MdLanguage,
  MdStorefront,
  MdCalendarToday,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";

import {
  useFetchBannersQuery,
  useToggleBannerStatusMutation,
  useDeleteBannerMutation,
} from "../../../features/banner/bannerApi";
import type {
  Banner,
  BannerUploadArea,
} from "../../../features/banner/bannerTypes";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import { ImagePreviewModal } from "../../../components/common/ImagePreviewModal";
import {
  DataTable,
  DataTableStatusToggle,
} from "../../../components/common/DataTable/DataTable";
import type { DataTableColumn } from "../../../components/common/DataTable/DataTable.types";
import { useHeader } from "../../../layout/LayoutContext";

import "../../../styles/banner/BannerList.css";

const PAGE_LIMIT = 10;
const ASSET_URL = (import.meta.env.VITE_API_ASSET_URL as string) || "";

const BannerList = () => {
  const [page, setPage] = useState(1);
  const [uploadAreaFilter, setUploadAreaFilter] = useState<
    BannerUploadArea | "all"
  >("all");
  const [statusFilter, setStatusFilter] = useState<number | "all">("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);

  // Full-screen Image Preview State
  const [previewImage, setPreviewImage] = useState<{
    isOpen: boolean;
    url: string | null;
    altText: string;
  }>({
    isOpen: false,
    url: null,
    altText: "",
  });

  const navigate = useNavigate();
  const { setHeaderConfig } = useHeader();

  useEffect(() => {
    setHeaderConfig({
      title: "Banners",
    });
  }, [setHeaderConfig]);

  // Debounced search handling
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useFetchBannersQuery({
      page,
      limit: PAGE_LIMIT,
      search: search || undefined,
      upload_area: uploadAreaFilter === "all" ? undefined : uploadAreaFilter,
      status: statusFilter === "all" ? undefined : (statusFilter as 0 | 1),
    });

  const [toggleBannerStatus] = useToggleBannerStatusMutation();
  const [deleteBanner, { isLoading: isDeleting }] = useDeleteBannerMutation();

  const banners = data?.data ?? [];
  const pagination = data?.pagination;

  const uploadAreaFilterOptions = [
    { value: "all", label: "All Platforms" },
    { value: "app", label: "App" },
    { value: "website", label: "Web" },
  ];

  const statusFilterOptions = [
    { value: "all", label: "All Status", badgeDot: "#94a3b8" },
    { value: "1", label: "Active", badgeDot: "#16a34a" },
    { value: "0", label: "Inactive", badgeDot: "#64748b" },
  ];

  const handleToggleStatus = async (banner: Banner) => {
    setUpdatingId(banner._id);
    try {
      await toggleBannerStatus(banner._id).unwrap();
      toast.success("Status updated", {
        description: `"${banner.title}" status changed successfully.`,
      });
    } catch (err: any) {
      console.error("Failed to update banner status:", err);
      toast.error("Failed to update status", {
        description: err?.data?.message || "Something went wrong.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const openDeleteModal = (banner: Banner) => {
    setSelectedBanner(banner);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBanner) return;
    const bannerTitle = selectedBanner.title;
    try {
      await deleteBanner(selectedBanner._id).unwrap();
      setIsDeleteModalOpen(false);
      setSelectedBanner(null);
      toast.success("Banner deleted", {
        description: `"${bannerTitle}" has been successfully removed.`,
      });
    } catch (err: any) {
      console.error("Failed to delete banner:", err);
      const errMsg =
        err?.data?.message || "Something went wrong. Please try again.";
      toast.error("Failed to delete banner", {
        description: errMsg,
      });
    }
  };

  const handleOpenPreview = (banner: Banner) => {
    if (!banner.banner_image) return;
    setPreviewImage({
      isOpen: true,
      url: `${ASSET_URL}${banner.banner_image}`,
      altText: banner.title,
    });
  };

  const formatExpiryDate = (endDate?: string | null) => {
    if (!endDate) return null;
    const parsed = new Date(endDate);
    if (Number.isNaN(parsed.getTime())) return null;

    const formatted = parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isExpired = parsed < today;

    return { formatted, isExpired };
  };

  const columns: DataTableColumn<Banner>[] = [
    {
      key: "title",
      header: "Banner",
      isPrimary: true,
      render: (banner) => (
        <div className="d-flex align-items-center gap-3">
          <div
            className="banner-list-thumb"
            title="Click to view full image"
            onClick={() => handleOpenPreview(banner)}
          >
            {banner.banner_image ? (
              <img
                src={`${ASSET_URL}${banner.banner_image}`}
                alt={banner.title}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove(
                    "d-none",
                  );
                }}
              />
            ) : null}
            <span
              className={`banner-list-thumb-fallback ${
                banner.banner_image ? "d-none" : ""
              }`}
            >
              <MdImage size={24} />
            </span>
          </div>

          <div className="d-flex flex-column">
            <span className="banner-list-title">{banner.title}</span>
            {banner.redirect_url && (
              <span className="banner-list-subtext" title={banner.redirect_url}>
                {banner.redirect_url}
              </span>
            )}
          </div>
        </div>
      ),
    },
    // {
    //   key: "store",
    //   header: "Store",
    //   render: (banner) => {
    //     const storeName = banner.store?.store_name;
    //     const storeLogo = banner.store?.store_logo;

    //     return (
    //       <div className="banner-store-cell">
    //         <div className="banner-store-avatar">
    //           {storeLogo ? (
    //             <img
    //               src={`${ASSET_URL}${storeLogo}`}
    //               alt={storeName || "Store"}
    //               onError={(e) => {
    //                 (e.currentTarget as HTMLImageElement).style.display =
    //                   "none";
    //                 e.currentTarget.nextElementSibling?.classList.remove(
    //                   "d-none",
    //                 );
    //               }}
    //             />
    //           ) : null}

    //           <span
    //             className={`banner-store-avatar-fallback ${
    //               storeLogo ? "d-none" : ""
    //             }`}
    //           >
    //             <MdStorefront size={17} />
    //           </span>
    //         </div>

    //         <span
    //           className={`banner-store-name ${
    //             !storeName ? "banner-store-name--muted" : ""
    //           }`}
    //           title={storeName || "No store assigned"}
    //         >
    //           {storeName || "N/A"}
    //         </span>
    //       </div>
    //     );
    //   },
    // },
    {
      key: "upload_area",
      header: "Platform",
      render: (banner) => {
        const isApp = banner.upload_area === "app";
        return (
          <div
            className={`banner-list-pill ${
              isApp ? "banner-list-pill--app" : "banner-list-pill--web"
            }`}
          >
            <span className="banner-list-pill-icon">
              {isApp ? <MdSmartphone size={12} /> : <MdLanguage size={12} />}
            </span>
            <span>{isApp ? "APP" : "WEB"}</span>
          </div>
        );
      },
    },
    {
      key: "end_date",
      header: "Expired On",
      render: (banner) => {
        const expiry = formatExpiryDate(banner.end_date);

        if (!expiry) {
          return (
            <div className="banner-expiry-cell banner-expiry-cell--none">
              <MdCalendarToday size={14} className="banner-expiry-icon" />
              <span>No expiry</span>
            </div>
          );
        }

        return (
          <div
            className={`banner-expiry-cell ${
              expiry.isExpired ? "banner-expiry-cell--expired" : ""
            }`}
            title={
              expiry.isExpired
                ? `Expired on ${expiry.formatted}`
                : `Expires on ${expiry.formatted}`
            }
          >
            <MdCalendarToday size={14} className="banner-expiry-icon" />
            <span>{expiry.formatted}</span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (banner) => (
        <DataTableStatusToggle
          active={banner.status === 1}
          isUpdating={updatingId === banner._id}
          onChange={() => handleToggleStatus(banner)}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (banner) => (
        <div className="cl-actions">
          <button
            type="button"
            className="cl-icon-btn"
            title="Edit"
            onClick={() => navigate(`/vendor/banners/${banner._id}/edit`)}
          >
            <MdModeEdit color="#1b3a5c" />
          </button>
          <button
            type="button"
            className="cl-icon-btn cl-icon-btn--danger"
            title="Delete"
            onClick={() => openDeleteModal(banner)}
          >
            <MdDelete color="red" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        statPills={[
          { label: `${pagination?.total ?? banners.length} total`, navy: true },
          { label: `${banners.filter((b) => b.status === 1).length} active` },
        ]}
        columns={columns}
        data={banners}
        getId={(b) => b._id}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search banners..."
        filters={[
          {
            value: String(uploadAreaFilter),
            onChange: (v) => {
              setUploadAreaFilter(v as BannerUploadArea | "all");
              setPage(1);
            },
            options: uploadAreaFilterOptions,
          },
          {
            value: String(statusFilter),
            onChange: (v) => {
              setStatusFilter(v === "all" ? "all" : Number(v));
              setPage(1);
            },
            options: statusFilterOptions,
          },
        ]}
        addButtonLabel="Add Banner"
        onAddClick={() => navigate("/vendor/banners/add")}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        errorMessage={`Couldn't load banners${
          error && "status" in error ? ` (${error.status})` : ""
        }.`}
        onRetry={refetch}
        emptyMessage={
          search ? `No banners match "${search}".` : "No banners yet."
        }
        pagination={pagination}
        onPageChange={setPage}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedBanner(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Banner"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong>"{selectedBanner?.title}"</strong>? This banner will no
            longer appear on selected placements.
          </>
        }
      />

      <ImagePreviewModal
        isOpen={previewImage.isOpen}
        imageUrl={previewImage.url}
        altText={previewImage.altText}
        onClose={() =>
          setPreviewImage({ isOpen: false, url: null, altText: "" })
        }
      />
    </>
  );
};

export default BannerList;
