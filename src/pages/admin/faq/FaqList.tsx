import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MdDelete, MdModeEdit, MdChevronRight } from "react-icons/md";
import {
  useFetchFaqsQuery,
  useDeleteFaqMutation,
  useToggleFaqStatusMutation,
} from "../../../features/faq/faqApi";
import type { Faq } from "../../../features/faq/faqTypes";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import {
  DataTable,
  DataTableStatusToggle,
} from "../../../components/common/DataTable/DataTable";
import type { DataTableColumn } from "../../../components/common/DataTable/DataTable.types";
import { useHeader } from "../../../layout/LayoutContext";

import "../../../styles/faq/FaqList.css";
import { FaqModal } from "./FaqModal";

const PAGE_LIMIT = 10;

const FaqList = () => {
  const [page, setPage] = useState(1);
  const [expandedFaqIds, setExpandedFaqIds] = useState<Record<string, boolean>>(
    {},
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<Faq | null>(null);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);

  const { setHeaderConfig } = useHeader();

  useEffect(() => {
    setHeaderConfig({
      title: "Frequently Asked Questions",
    });
  }, [setHeaderConfig]);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useFetchFaqsQuery({
      page,
      limit: PAGE_LIMIT,
    });

  const [toggleFaqStatus] = useToggleFaqStatusMutation();
  const [deleteFaq, { isLoading: isDeleting }] = useDeleteFaqMutation();

  const faqs = data?.data ?? [];
  const pagination = data?.pagination;

  const toggleExpand = (id: string) => {
    setExpandedFaqIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleStatus = async (faq: Faq) => {
    setUpdatingId(faq._id);

    try {
      const response = await toggleFaqStatus(faq._id).unwrap();

      toast.success("FAQ status updated", {
        description: `Status changed to ${response.data.status}.`,
      });
    } catch (err: any) {
      console.error("Failed to update FAQ status:", err);

      toast.error("Failed to update status", {
        description: err?.data?.message || "Something went wrong.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const openDeleteModal = (faq: Faq) => {
    setSelectedFaq(faq);
    setIsDeleteModalOpen(true);
  };

  const openAddModal = () => {
    setEditingFaqId(null);
    setIsFaqModalOpen(true);
  };

  const openEditModal = (faq: Faq) => {
    setEditingFaqId(faq._id);
    setIsFaqModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedFaq) return;
    try {
      await deleteFaq(selectedFaq._id).unwrap();
      setIsDeleteModalOpen(false);
      setSelectedFaq(null);
      toast.success("FAQ deleted successfully", {
        description: "The FAQ has been permanently removed.",
      });
    } catch (err: any) {
      console.error("Failed to delete FAQ:", err);
      const errMsg =
        err?.data?.message || "Something went wrong. Please try again.";
      toast.error("Failed to delete FAQ", {
        description: errMsg,
      });
    }
  };

  const columns: DataTableColumn<Faq>[] = [
    {
      key: "question",
      header: "Question & Answer",
      isPrimary: true,
      render: (faq) => {
        const isOpen = Boolean(expandedFaqIds[faq._id]);
        return (
          <div className="faq-question-cell">
            <div
              className="faq-question-row"
              onClick={() => toggleExpand(faq._id)}
              title={isOpen ? "Collapse Answer" : "Expand Answer"}
            >
              <button
                type="button"
                className={`faq-expand-btn ${isOpen ? "faq-expand-btn--open" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(faq._id);
                }}
              >
                <MdChevronRight size={18} />
              </button>
              <span className="faq-question-text">{faq.question}</span>
            </div>

            {isOpen && (
              <div className="faq-answer-collapse">
                <div className="faq-answer-box">
                  <span className="faq-answer-label">Answer</span>
                  <p className="faq-answer-text">{faq.answer}</p>
                </div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "createdAt",
      header: "Created Date",
      headerClassName: "d-none d-md-table-cell",
      cellClassName: "d-none d-md-table-cell",
      render: (faq) => {
        const dateStr = faq.createdAt
          ? new Date(faq.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—";
        return <span className="faq-date-text">{dateStr}</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (faq) => (
        <DataTableStatusToggle
          active={faq.status === "active"}
          isUpdating={updatingId === faq._id}
          onChange={() => handleToggleStatus(faq)}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (faq) => (
        <div className="cl-actions">
          <button
            type="button"
            className="cl-icon-btn"
            title="Edit"
            onClick={() => openEditModal(faq)}
          >
            <MdModeEdit color="#1b3a5c" />
          </button>
          <button
            type="button"
            className="cl-icon-btn cl-icon-btn--danger"
            title="Delete"
            onClick={() => openDeleteModal(faq)}
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
          { label: `${pagination?.total ?? faqs.length} total`, navy: true },
          {
            label: `${faqs.filter((f) => f.status === "active").length} active`,
          },
        ]}
        columns={columns}
        data={faqs}
        getId={(f) => f._id}
        addButtonLabel="Add FAQ"
        onAddClick={openAddModal}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        errorMessage={`Couldn't load FAQs${
          error && "status" in error ? ` (${error.status})` : ""
        }.`}
        onRetry={refetch}
        emptyMessage="No FAQs available yet."
        pagination={pagination}
        onPageChange={setPage}
      />

      <FaqModal
        isOpen={isFaqModalOpen}
        faqId={editingFaqId}
        onClose={() => {
          setIsFaqModalOpen(false);
          setEditingFaqId(null);
        }}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedFaq(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete FAQ"
        message={
          <>
            Are you sure you want to delete this FAQ:
            <br />
            <strong>"{selectedFaq?.question}"</strong>?
          </>
        }
      />
    </>
  );
};

export default FaqList;
