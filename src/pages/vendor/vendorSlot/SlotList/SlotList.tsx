import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { HiCalendar, HiClock, HiLocationMarker, HiTag } from "react-icons/hi";
import { MdDelete, MdModeEdit } from "react-icons/md";
import {
  useGetMyVendorSlotsQuery,
  useUpdateVendorSlotAvailabilityMutation,
} from "../../../../features/vendor/vendorApi";
import type { VendorSlot } from "../../../../features/vendor/vendorTypes";
import {
  DataTable,
  DataTableStatusToggle,
} from "../../../../components/common/DataTable/DataTable";
import type { DataTableColumn } from "../../../../components/common/DataTable/DataTable.types";
import { ConfirmationModal } from "../../../../components/common/ConfirmationModal";
import { useHeader } from "../../../../layout/LayoutContext";
import "../../../../styles/vendor/SlotList.css";
import SlotFilters, { type SlotFiltersValue } from "./SlotFilters";
import { useGetActiveCategoriesQuery } from "../../../../features/category/categoryApi";
import { collectPreLeafCategories } from "../AddSlot/utils/addSlotUtils";

const PAGE_LIMIT = 20;

const EMPTY_FILTERS: SlotFiltersValue = {
  category_id: "",
  status: "",
  date: "",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const SlotTypeBadge: React.FC<{ types: string[] }> = ({ types }) => (
  <div className="sl-type-wrap">
    {types.map((t) => (
      <span key={t} className="sl-type-pill">
        {t}
      </span>
    ))}
  </div>
);

const SlotList = () => {
  const navigate = useNavigate();
  const { setHeaderConfig } = useHeader();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SlotFiltersValue>(EMPTY_FILTERS);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<VendorSlot | null>(null);

  useEffect(() => {
    setHeaderConfig({ title: "My Slots" });
  }, [setHeaderConfig]);

  // Reset to page 1 whenever filters change
  const handleFiltersChange = (next: SlotFiltersValue) => {
    setFilters(next);
    setPage(1);
  };

  const { data, isLoading, isFetching, isError, refetch } =
    useGetMyVendorSlotsQuery({
      page,
      limit: PAGE_LIMIT,
      ...(filters.category_id ? { category_id: filters.category_id } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.date ? { date: filters.date } : {}),
    });

  const [updateSlotStatus] = useUpdateVendorSlotAvailabilityMutation();

  const { data: categoriesRes, isLoading: categoriesLoading } =
    useGetActiveCategoriesQuery();

  const categoryOptions = useMemo(
    () => collectPreLeafCategories(categoriesRes?.data ?? []),
    [categoriesRes],
  );

  const slots = data?.data ?? [];
  const pagination = data?.pagination;

  const handleToggleStatus = async (slot: VendorSlot) => {
    setUpdatingId(slot._id);
    try {
      await updateSlotStatus(slot._id).unwrap();
    } catch (err: any) {
      console.error("Failed to update slot status:", err);
      toast.error("Failed to update slot status", {
        description: err?.data?.message ?? "Something went wrong.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const openDeleteModal = (slot: VendorSlot) => {
    setSelectedSlot(slot);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSlot) return;
    try {
      toast.success("Slot deleted", {
        description: `Slot on ${formatDate(selectedSlot.date)} has been removed.`,
      });
      setIsDeleteModalOpen(false);
      setSelectedSlot(null);
    } catch (err: any) {
      toast.error("Failed to delete slot", {
        description: err?.data?.message ?? "Something went wrong.",
      });
    }
  };

  const columns: DataTableColumn<VendorSlot>[] = [
    {
      key: "categoryName",
      header: "Category",
      isPrimary: true,
      render: (slot) => (
        <>
          <span className="sl-icon-cell">
            <HiTag size={15} />
          </span>
          <span className="sl-primary-text">
            <span className="sl-name">{slot.categoryName}</span>
            <SlotTypeBadge types={slot.slotType} />
          </span>
        </>
      ),
    },
    {
      key: "date",
      header: "Date",
      headerClassName: "d-none d-md-table-cell",
      cellClassName: "d-none d-md-table-cell",
      render: (slot) => (
        <span className="sl-meta-cell">
          <HiCalendar size={13} className="sl-meta-icon" />
          {formatDate(slot.date)}
        </span>
      ),
    },
    {
      key: "startTime",
      header: "Time Window",
      headerClassName: "d-none d-md-table-cell",
      cellClassName: "d-none d-md-table-cell",
      render: (slot) => (
        <span className="sl-meta-cell">
          <HiClock size={13} className="sl-meta-icon" />
          {slot.startTime} – {slot.endTime}
        </span>
      ),
    },
    {
      key: "location",
      header: "Coordinates",
      headerClassName: "d-none d-lg-table-cell",
      cellClassName: "d-none d-lg-table-cell",
      render: (slot) => (
        <span className="sl-meta-cell sl-coords">
          <HiLocationMarker size={13} className="sl-meta-icon" />[
          {slot.location.coordinates[0]}, {slot.location.coordinates[1]}]
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (slot) => (
        <DataTableStatusToggle
          active={slot.status === "available"}
          activeLabel="Available"
          inactiveLabel="Unavailable"
          isUpdating={updatingId === slot._id}
          onChange={() => handleToggleStatus(slot)}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (slot) => (
        <div className="cl-actions">
          <button
            type="button"
            className="cl-icon-btn"
            title="Edit slot"
            onClick={() => navigate(`/vendor/slots/${slot._id}/edit`)}
          >
            <MdModeEdit color="#1b3a5c" />
          </button>
          <button
            type="button"
            className="cl-icon-btn cl-icon-btn--danger"
            title="Delete slot"
            onClick={() => openDeleteModal(slot)}
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
          { label: `${pagination?.total ?? 0} total`, navy: true },
          {
            label: `${slots.filter((s) => s.status === "available").length} available · this page`,
          },
          {
            label: `${slots.filter((s) => s.status === "booked").length} booked · this page`,
          },
        ]}
        columns={columns}
        data={slots}
        getId={(s) => s._id}
        addButtonLabel="Add Slot"
        onAddClick={() => navigate("/vendor/slots/add")}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        errorMessage="Couldn't load slots. Please try again."
        onRetry={refetch}
        emptyMessage="No slots yet. Add your first availability slot."
        pagination={pagination}
        onPageChange={setPage}
        headerExtra={
          <SlotFilters
            value={filters}
            onChange={handleFiltersChange}
            categoryOptions={categoryOptions}
            categoriesLoading={categoriesLoading}
          />
        }
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedSlot(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={false}
        title="Delete Slot"
        message={
          selectedSlot ? (
            <>
              Are you sure you want to delete the slot on{" "}
              <strong>{formatDate(selectedSlot.date)}</strong> (
              <strong>
                {selectedSlot.startTime} – {selectedSlot.endTime}
              </strong>
              )? This cannot be undone.
            </>
          ) : null
        }
      />
    </>
  );
};

export default SlotList;
