import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useDeleteVendorCouponMutation,
  useGetVendorCouponListQuery,
  useUpdateVendorCouponStatusMutation,
} from "../../../features/coupon/couponAPI";
import type { Coupon } from "../../../features/coupon/couponTypes";
import {
  MdDelete,
  MdModeEdit,
  MdOutlineImageNotSupported,
  MdShield,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import {
  DataTable,
  DataTableStatusToggle,
} from "../../../components/common/DataTable/DataTable";
import type { DataTableColumn } from "../../../components/common/DataTable/DataTable.types";
import { useHeader } from "../../../layout/LayoutContext";
import "../../../styles/coupon/CouponList.css";
import { ImagePreviewModal } from "../../../components/common/ImagePreviewModal";

const PAGE_LIMIT = 10;

const CouponList = () => {
  const [page, setPage] = useState(1);

  const [statusFilter, setStatusFilter] = useState<"all" | "0" | "1">("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const navigate = useNavigate();
  const { setHeaderConfig } = useHeader();

  useEffect(() => {
    setHeaderConfig({ title: "Coupons" });
  }, [setHeaderConfig]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetVendorCouponListQuery({
      page,
      limit: PAGE_LIMIT,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : Number(statusFilter),
    });

  const [updateCouponStatus] = useUpdateVendorCouponStatusMutation();
  const [deleteCoupon] = useDeleteVendorCouponMutation();

  const coupons = data?.data ?? [];
  const pagination = data?.pagination;

  const stats = useMemo(() => {
    const total = pagination?.total ?? coupons.length;
    const active = coupons.filter((c) => c.status === 1).length;
    const inactive = coupons.filter((c) => c.status === 0).length;
    return { total, active, inactive };
  }, [coupons, pagination]);

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === "percentage") {
      return `${coupon.discount_value}% OFF`;
    }
    return `₹${coupon.discount_value} OFF`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isExpired = (endDate: string) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  const isLifetime = (endDate: string) => !endDate;

  const handleToggleStatus = async (coupon: Coupon) => {
    setUpdatingId(coupon._id);
    try {
      await updateCouponStatus(coupon._id).unwrap();
      const nextStatus = coupon.status === 1 ? "inactive" : "active";
      toast.success("Status updated", {
        description: `Coupon "${coupon.code}" is now ${nextStatus}.`,
      });
    } catch (err: any) {
      const errMsg =
        err?.data?.message || "Failed to update status. Please try again.";
      toast.error("Status update failed", { description: errMsg });
    } finally {
      setUpdatingId(null);
    }
  };

  const openDeleteModal = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCoupon) return;
    const couponCode = selectedCoupon.code;
    setIsDeleting(true);
    try {
      await deleteCoupon(selectedCoupon._id).unwrap();
      setIsDeleteModalOpen(false);
      setSelectedCoupon(null);
      toast.success("Coupon deleted", {
        description: `"${couponCode}" has been successfully removed.`,
      });
    } catch (error: any) {
      const errMsg =
        error?.data?.message || "Something went wrong. Please try again.";
      toast.error("Failed to delete coupon", { description: errMsg });
    } finally {
      setIsDeleting(false);
    }
  };

  const getImageUrl = (image?: string) => {
    if (!image) return "";

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    return `${import.meta.env.VITE_API_ASSET_URL}${image}`;
  };

  const columns: DataTableColumn<Coupon>[] = [
    {
      key: "user_details",
      header: "Name",
      isPrimary: true,
      render: (coupon) => {
        const isSuperAdmin = coupon.created_by_role === "SuperAdmin";
        return (
          <span className="couponlist-name-cell">
            <span className="couponlist-name-info">
              <span className="couponlist-name">{coupon.title}</span>

              <span className="couponlist-meta-badges">
                <span
                  className={`coupon-badge ${
                    isSuperAdmin && "coupon-badge--admin"
                  }`}
                >
                  {isSuperAdmin && <MdShield />}
                  <span>{isSuperAdmin && "Super Admin"}</span>
                </span>
              </span>
            </span>
          </span>
        );
      },
    },
    {
      key: "code",
      header: "Coupon Code",
      render: (coupon) => (
        <span className="couponlist-code-wrap">
          <span className="couponlist-code">{coupon.code}</span>
          <button
            type="button"
            className="couponlist-copy-btn"
            title="Copy code"
            onClick={() => {
              navigator.clipboard.writeText(coupon.code);
              toast.success("Copied!", { description: coupon.code });
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect
                x="9"
                y="9"
                width="13"
                height="13"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        </span>
      ),
    },
    {
      key: "discount_value",
      header: "Discount",
      render: (coupon) => {
        const isPercentage = coupon.discount_type === "percentage";
        return (
          <span
            className={`couponlist-discount-badge ${
              isPercentage
                ? "couponlist-discount-badge--pct"
                : "couponlist-discount-badge--fixed"
            }`}
          >
            {formatDiscount(coupon)}
          </span>
        );
      },
    },
    {
      key: "end_date",
      header: "Date Valid",
      render: (coupon) => {
        if (isLifetime(coupon.end_date)) {
          return (
            <span className="couponlist-lifetime">
              <span className="couponlist-infinity">∞</span> Lifetime
            </span>
          );
        }
        return (
          <span
            className={
              isExpired(coupon.end_date)
                ? "couponlist-expired-date"
                : "couponlist-date"
            }
          >
            {formatDate(coupon.end_date)}
          </span>
        );
      },
    },
    {
      key: "usage_limit",
      header: "Sales / Limit",
      render: (coupon) => {
        const isUnlimited = !coupon.usage_limit || coupon.usage_limit === 0;
        return isUnlimited ? (
          <span className="couponlist-lifetime">
            <span className="couponlist-infinity">∞</span> Unlimited
          </span>
        ) : (
          <span className="couponlist-usage">
            {coupon.used_count}/{coupon.usage_limit}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (coupon) => (
        <DataTableStatusToggle
          active={coupon.status === 1}
          isUpdating={updatingId === coupon._id}
          onChange={() => handleToggleStatus(coupon)}
        />
      ),
    },
    {
      key: "images",
      header: "Banners",
      render: (coupon) => {
        const hasWeb = !!coupon.website_image;
        const hasMobile = !!coupon.mobile_image;

        if (!hasWeb && !hasMobile) {
          return (
            <div
              className="couponlist-empty-image-badge"
              title="No banners uploaded"
            >
              <MdOutlineImageNotSupported className="couponlist-empty-icon" />
              <span>No image</span>
            </div>
          );
        }

        return (
          <div className="couponlist-media-group">
            {hasWeb && (
              <button
                type="button"
                className="couponlist-thumb-pill"
                onClick={() =>
                  setPreviewImage(getImageUrl(coupon.website_image))
                }
                title="Preview Website Banner"
              >
                <img
                  src={getImageUrl(coupon.website_image)}
                  alt="Web"
                  className="couponlist-thumb-img"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
                <span className="couponlist-thumb-label">Web</span>
              </button>
            )}

            {hasMobile && (
              <button
                type="button"
                className="couponlist-thumb-pill"
                onClick={() =>
                  setPreviewImage(getImageUrl(coupon.mobile_image))
                }
                title="Preview Mobile Banner"
              >
                <img
                  src={getImageUrl(coupon.mobile_image)}
                  alt="App"
                  className="couponlist-thumb-img"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
                <span className="couponlist-thumb-label">App</span>
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (coupon) => (
        <div className="couponlist-actions">
          <button
            type="button"
            className="couponlist-icon-btn"
            title="Edit"
            onClick={() => navigate(`/vendor/coupons/${coupon._id}/edit`)}
          >
            <MdModeEdit color="#1b3a5c" />
          </button>
          <button
            type="button"
            className="couponlist-icon-btn couponlist-icon-btn--danger"
            title="Delete"
            onClick={() => openDeleteModal(coupon)}
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
          { label: `${stats.total} total`, navy: true },
          ...(stats.active > 0 ? [{ label: `${stats.active} active` }] : []),
          ...(stats.inactive > 0
            ? [{ label: `${stats.inactive} inactive` }]
            : []),
        ]}
        columns={columns}
        data={coupons}
        getId={(c) => c._id}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by name, email or coupon code..."
        filters={[
          {
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v as any);
              setPage(1);
            },
            options: [
              { value: "all", label: "All Status" },
              { value: "1", label: "Active" },
              { value: "0", label: "Inactive" },
            ],
          },
        ]}
        addButtonLabel="Add Coupon"
        onAddClick={() => navigate("/vendor/coupons/add")}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        errorMessage={`Couldn't load coupons${
          error && "status" in error ? ` (${error.status})` : ""
        }.`}
        onRetry={refetch}
        emptyMessage={
          search ? `No coupons match "${search}".` : "No coupons yet."
        }
        pagination={pagination}
        onPageChange={setPage}
      />

      <ImagePreviewModal
        isOpen={Boolean(previewImage)}
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCoupon(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Coupon"
        message={
          <>
            Are you sure you want to delete coupon{" "}
            <strong>"{selectedCoupon?.code}"</strong>? This action cannot be
            undone.
          </>
        }
      />
    </>
  );
};

export default CouponList;
